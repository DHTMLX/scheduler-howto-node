require("date-format-lite"); // add date format
var xssFilters = require('xss-filters');

class Storage {
	constructor(connection) {
		this._db = connection;
		this.table = "recurring_events";
	}

	// get events from the table, use dynamic loading if parameters sent
	async getAll(params) {
		let query = "SELECT * FROM ?? ";
		let queryParams = [
			this.table
		];

		if (params.from && params.to) {
			query += " WHERE `end_date` >= ? AND `start_date` < ?";
			queryParams.push(params.from);
			queryParams.push(params.to);
		}

		let result = await this._db.query(query, queryParams);

		result.forEach((entry) => {
			// format date and time
			entry.id = xssFilters.inHTMLData(entry.id);
			entry.text = xssFilters.inHTMLData(entry.text);
			entry.event_pid = xssFilters.inHTMLData(entry.event_pid);
			entry.event_length = xssFilters.inHTMLData(entry.event_length);
			entry.rec_type = xssFilters.inHTMLData(entry.rec_type);
			entry.start_date = entry.start_date.format("YYYY-MM-DD hh:mm");
			entry.end_date = entry.end_date.format("YYYY-MM-DD hh:mm");
		});

		return result;
	}

	// create new event
	async insert(data) {
		let sql = "INSERT INTO ?? " +
			"(`start_date`, `end_date`, `text`, `event_pid`, `event_length`, `rec_type`) " +
			"VALUES (?, ?, ?, ?, ?, ?)";

		const result = await this._db.query(
			sql,
			[
				this.table,
				data.start_date,
				data.end_date,
				data.text,
				data.event_pid || 0,
				data.event_length || 0,
				data.rec_type
			]);


		// delete a single occurrence from  recurring series
		let action = "inserted";
		if (data.rec_type == "none") {
			action = "deleted";
		}

		return {
			action: action,
			tid: result.insertId
		};
	}

	// update event
	async update(id, data) {
		if (data.rec_type && data.rec_type != "none") {
			// all modified occurrences must be deleted when we update recurring series
			// https://docs.dhtmlx.com/scheduler/server_integration.html#savingrecurringevents
			await this._db.query(
				"DELETE FROM ?? WHERE `event_pid`= ?;",
				[this.table, id]);
		}

		await this._db.query(
			"UPDATE ?? SET " +
			"`start_date` = ?, `end_date` = ?, `text` = ?, `event_pid` = ?, `event_length`= ?, `rec_type` = ? "+
			"WHERE id = ?",
			[
				this.table,
				data.start_date,
				data.end_date,
				data.text,
				data.event_pid || 0,
				data.event_length || 0,
				data.rec_type,
				id
			]);

		return {
			action: "updated"
		};
	}

	// delete event
	async delete(id) {

		// some logic specific to recurring events support
		// https://docs.dhtmlx.com/scheduler/server_integration.html#savingrecurringevents
		let event = await this._db.query(
			"SELECT * FROM ?? WHERE id=? LIMIT 1;",
			[this.table, id]);

		if (event.event_pid) {
			// deleting modified occurrence from recurring series
			// If an event with the event_pid value was deleted - it needs updating with rec_type==none instead of deleting.
			event.rec_type = "none";
			return await this.update(id, event);
		}

		if (event.rec_type && event.rec_type != "none") {
			// if a recurring series was deleted - delete all modified occurrences of the series
			await this._db.query(
				"DELETE FROM ?? WHERE `event_pid`=? ;",
				[this.table, id]);
		}

		await this._db.query(
			"DELETE FROM ?? WHERE `id`= ?;",
			[this.table, id]);

		return {
			action: "deleted"
		}
	}
}

module.exports = Storage;
