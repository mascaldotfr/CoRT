export class BossesRespawns {
	// The first known respawns timestamp in UTC time
	// Last checked: Eve: 2026-01-14, Daen: 2026-01-17, TK: 2026-02-13, Server: 2025-10-30 (+50m)
	static first_respawns = {
		"thorkul": 	1768146754,
		"evendim": 	1768416250,
		"daen": 	1768672935,
		"server": 	1762336800 + 50 * 60
	};

	// Bosses drift by spawn, in seconds.
	static respawns_drift = {
		"thorkul":	4,
		"evendim":	7,
		"daen":   	5
	};

	static get_schedule(respawns = 4) {
		if (respawns < 1)
			throw new Error("$respawns must be a positive integer!");

		let next_respawns = {
			"evendim": [],
			"daen": [],
			"thorkul": [],
			"server": []
		};
		let previous_respawns = {
			"evendim": 0,
			"daen": 0,
			"thorkul": 0,
			"server": 0
		};

		const now = Math.floor(Date.now() / 1000);

		// calculate future respawns
		for (let boss in this.first_respawns) {
			let respawn_time = 0;

			if (boss === "server")
				respawn_time = 7 * 24 * 3600; // 1 week
			else
				respawn_time = 61 * 3600 + this.respawns_drift[boss];

			// Elapsed time from now since the first respawn
			let elapsed = now - this.first_respawns[boss];
			// Compute how many respawns there have been since then
			let old_respawns = parseInt(elapsed / respawn_time);
			// Get the last respawn timestamp
			previous_respawns[boss] = this.first_respawns[boss] + old_respawns * respawn_time;
			// Then generate future respawns
			for (let i = 1; i <= respawns; i++)
				next_respawns[boss].push(previous_respawns[boss] + i * respawn_time);
		}

		// get the next respawn timestamp and name
		let next_boss = null;
		let next_boss_ts = Infinity;
		for (let boss in next_respawns) {
			for (let spawntime of next_respawns[boss]) {
				if (spawntime < next_boss_ts) {
					next_boss = boss;
					next_boss_ts = spawntime;
				}
			}
		}

		return {
			"prev_spawns": previous_respawns,
			"next_spawns": next_respawns,
			"next_boss": next_boss,
			"next_boss_ts": next_boss_ts
		};
	}
}
