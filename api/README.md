# APIs

The whole API is written in PHP. Each endpoint has its own README.

> [!WARNING]
> The cort.ovh API URLs are for CoRT's internal, private use only. Any attempt
> to circumvent this will eventually be detected and offenders blocked. If you
> are going public, self-host your own API: the source code is here, and
> deployment instructions are in [`/deploy`](../deploy/README.md).
>
> As an alternative, event-driven access to the WZ endpoints is available.
> Check the [SSE endpoints documentation](SSE.md).

## Documentation

- [Setup collector and trainer stats](bin/collect/README.md)
- [Warstatus](bin/warstatus/README.md)
- [Warzone stats and events](bin/warstatus/stats/README.md)
- [Sentinel](bin/warstatus/README.sentinel.md)

## Operations

- [Deployment](../deploy/README.md)
- [Maintenance message](MAINTENANCE.md)
