export class BZSchedule {
	// BZ Schedule (UTC hours)
	// SUNDAY = 0, SATURDAY = 6
	static bz_schedule = {
		schbegin: [
			[13, 18],        // Sunday
			[3, 13, 20],     // Monday
			[13, 18],        // Tuesday
			[13, 20],        // Wednesday
			[3, 13, 18],     // Thursday
			[13, 20],        // Friday
			[3, 13, 20]      // Saturday
		],
		schend: [
			[16, 21],        // Sunday
			[6, 16, 23],     // Monday
			[16, 21],        // Tuesday
			[16, 23],        // Wednesday
			[6, 16, 21],     // Thursday
			[17, 23],        // Friday
			[6, 16, 23]      // Saturday
		]
	};


	static get() {
		const now = new Date();
		const current_day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
		const current_hour = now.getUTCHours();
		const bz_schedule = this.bz_schedule;

		let bz_on = false;
		let bzendsat = 0;
		let next_bzs_begin = [];
		let next_bzs_end = [];

		// get current bz status
		for (let hour = 0; hour < bz_schedule.schbegin[current_day].length; hour++) {
			if (current_hour >= bz_schedule.schbegin[current_day][hour] &&
				current_hour < bz_schedule.schend[current_day][hour]) {
				bz_on = true;
				// Clone current time and set to end hour of current BZ
				let ends_at = new Date(now);
				ends_at.setUTCHours(bz_schedule.schend[current_day][hour], 0, 0, 0);
				bzendsat = Math.floor(ends_at.getTime() / 1000);
				break;
			}
		}

		// compute future bzs
		let tomorrow = current_day === 6 ? 0 : current_day + 1;
		let check_bzs_days = [current_day, tomorrow];
		let day_offset = 0;

		// Ensure there will be BZs for 2 days when announcing the last BZ of the day
		// (due to the fact it's shared with CoRT-dc)
		const last_bz_hour = bz_schedule.schbegin[current_day][bz_schedule.schbegin[current_day].length - 1];
		if (current_hour >= last_bz_hour) {
			let day_after_tomorrow = tomorrow === 6 ? 0 : tomorrow + 1;
			check_bzs_days = [tomorrow, day_after_tomorrow];
			day_offset = 1; // skip today
		}

		for (let i = 0; i < check_bzs_days.length; i++) {
			let day = check_bzs_days[i];
			for (let hour = 0; hour < bz_schedule.schbegin[day].length; hour++) {
				// skip passed BZ of the day
				if (day == current_day && bz_schedule.schbegin[day][hour] <= current_hour) {
					continue;
				}

				// Create a Date for the target day (today or future)
				let time_holder = new Date(now);
				time_holder.setUTCDate(time_holder.getUTCDate() + day_offset);
				time_holder.setUTCHours(bz_schedule.schbegin[day][hour], 0, 0, 0);
				next_bzs_begin.push(Math.floor(time_holder.getTime() / 1000));
				let time_holder_end = new Date(now);

				time_holder_end.setUTCDate(time_holder_end.getUTCDate() + day_offset);
				time_holder_end.setUTCHours(bz_schedule.schend[day][hour], 0, 0, 0);
				next_bzs_end.push(Math.floor(time_holder_end.getTime() / 1000));
			}
			day_offset++;
		}

		return {
			bzbegin: next_bzs_begin,
			bzend: next_bzs_end,
			bzon: bz_on,
			bzendsat: bzendsat,
			schbegin: bz_schedule.schbegin,
			schend: bz_schedule.schend
		};
	}
}

