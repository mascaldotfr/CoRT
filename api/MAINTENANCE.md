# MAINTENANCE

This API endpoint allows to display a message in a red card on top of each
page, to warn for servers issues and potentially other stuff, if
`/api/var/maintenance.txt` exists and is non-empty.

## URL

https://cort.ovh/api/var/maintenance.txt

## Usage

### Add a maintenance message

Create/Open the `maintenance.txt` file inside `/api/var`, and put your
maintenance message there. HTML is allowed.

### Remove a maintenance message

Just empty the file. It must be zero byte long.

It's not recommended to delete the file, for SEO reasons.
