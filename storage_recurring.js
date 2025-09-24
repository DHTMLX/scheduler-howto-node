import "date-format-lite"; // add date format
import xssFilters from 'xss-filters';

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

		const [rows] = await this._db.query(query, queryParams);

		rows.forEach((entry) => {
			// format date and time
			entry.id = xssFilters.inHTMLData(entry.id);
			entry.text = xssFilters.inHTMLData(entry.text);
			entry.start_date = entry.start_date.format("YYYY-MM-DD hh:mm");
			entry.end_date = entry.end_date.format("YYYY-MM-DD hh:mm");
		});

		return rows;
	}

	// create new event
	async insert(data) {
		let sql =
			"INSERT INTO ?? " +
			"(`start_date`, `end_date`, `text`, `duration`, `rrule`, `recurring_event_id`, `original_start`, `deleted`) " +
			"VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

		const [result] = await this._db.query(sql, [
			this.table,
			data.start_date,
			data.end_date,
			data.text || null,
			data.duration || null,
			data.rrule || null,
			data.recurring_event_id || null,
			data.original_start || null,
			data.deleted === "true" || null,
		]);


		// delete a single occurrence from  recurring series
		let action = "inserted";
		if (data.deleted) {
			action = "deleted";
		}

		return {
			action,
			tid: result.insertId
		};
	}

	// update event
	async update(id, data) {
		if (data.rrule && data.recurring_event_id == null) {
			//all modified occurrences must be deleted when you update a recurring series
			//https://docs.dhtmlx.com/scheduler/server_integration.html#recurringevents
			await this._db.query(
				"DELETE FROM ?? WHERE `recurring_event_id`= ?;",
				[this.table, id]
			);
		}

		await this._db.query(
			"UPDATE ?? SET " +
				"`start_date` = ?, `end_date` = ?, `text` = ?, " +
				"`duration` = ?, `rrule`= ?, `recurring_event_id` = ?, `original_start` = ?, `deleted` = ? " +
				"WHERE id = ?",
			[
				this.table,
				data.start_date,
				data.end_date,
				data.text || null,
				data.duration || null,
				data.rrule || null,
				data.recurring_event_id || null,
				data.original_start || null,
				data.deleted === "true" || null,
				id,
			]
		);

		return {
			action: "updated"
		};
	}

	// delete event
	async delete(id) {
		// First, find the event to understand its details
		const [rows] = await this._db.query(
			"SELECT * FROM ?? WHERE `id` = ?;",
			[this.table, id]
		);
		const dbEvent = rows[0];
		if (!dbEvent) {
			return {
				message: "Event with given id not found",
			};
		}
		if (dbEvent.recurring_event_id) {
			// deleting modified occurrence from recurring series
			// If an event with the recurring_event_id value was deleted - it needs updating with .deleted = true instead of deleting.
			await this._db.query(
				"UPDATE ?? SET `deleted` = 1 WHERE `id` = ?;",
				[this.table, id]
			);
		} else {
			if (dbEvent.rrule) {
				// if a recurring series was deleted - delete all modified occurrences of the series
				await this._db.query(
					"DELETE FROM ?? WHERE `recurring_event_id` = ?;",
					[this.table, id]
				);
			}
			// Delete the main event
			await this._db.query("DELETE FROM ?? WHERE `id` = ?;", [
				this.table,
				id,
			]);
		}
		return { action: "deleted" };
	}
}

export default Storage;
