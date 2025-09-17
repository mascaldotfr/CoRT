export const constants = {
	// min player level
	minlevel: 10,
	// max player level
	maxlevel: 60,
	// minimum discipline level
	mindlevel: 1,
	// maximum discipline level
	maxdlevel: 19,
	// minimum power level
	minplevel: 0,
	// maximum power level
	maxplevel: 5,
	// class masks are used to fetch the good trees for any class
	class_type_masks: {
		archer: 0x10, hunter: 0x11, marksman: 0x12,
		mage: 0x20, conjurer: 0x21, warlock: 0x22,
		warrior: 0x40, barbarian: 0x41, knight: 0x42
	},
	// class list (will propagate to class order in trainer and trainer stats)
	classes: ["knight", "barbarian", "conjurer", "warlock", "hunter", "marksman"],
	// datasets available in `/data`, in ascending order (ALWAYS!)
	datasets: ["1.33.2", "1.33.3", "1.33.6", "1.33.12", "1.35.19"]
};
