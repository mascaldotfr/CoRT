# DEV

CoRT sometimes needs rebundled libraries and tools, so here is a collection of
scripts to do so.



## mock_api.sh

This script fetches the live static data files and the SQLite database directly
from the CoRT production server (`cort.ovh`).

It is designed to populate the `api/var/` directory in a local development
environment. It also ensures these endpoints work when you aren't using a host
configured to use the "official API" (see `js/libs/cortlibs.js`).

The generated local API allows you to work on frontend tuning, or testing new
backend code, at your heat content.

### Prerequisites

- `bash`
- `curl`

### Usage

```bash
./mock_api.sh
```

It downloads the following files:

- `wstatus.json`
- `stats.json`
- `events.json`
- `trainer_saved_setups.txt`
- `maintenance.txt`
- `events.sqlite`

## floating-ui.sh

This script builds a minimal, custom bundle of the `@floating-ui/dom` library.
It temporarily installs the package via npm, uses `esbuild` to bundle and
aggressively minify only the required functions (`computePosition`, `flip`,
`shift`, `offset`), and outputs the result to
`../js/libs/floating-ui-tooltip.js`, ready for production.

### Prerequisites

- `node` and `npm`
- Internet connection (to fetch the package from the npm registry)

### Usage

```bash
./floating-ui.sh
```
