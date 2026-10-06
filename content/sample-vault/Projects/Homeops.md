---
publish: true
name: Homeops
summary: My home lab rebuilt as code, with every container, backup and dashboard in one repo.
status: building
started: 2026-03
tags: [docker, tailscale, grafana, iac]
links:
  - label: repo
    href: https://github.com/wit03/homeops
---

Homeops started when my one-box home server outgrew the notes I kept about it. The goal is that I can
wipe the machine and get everything back with one command: 35+ containers, monitoring, and 3-2-1 backups.

> [!note] Where it runs
> Everything here runs on one mini PC under my desk. No cloud bills.

## 2026-10-03 Backups survived their first real restore

Pulled the SSD on purpose and restored from the offsite copy. **41 minutes** from blank disk to every
service green. The slowest part was re-pulling images.

## 2026-09-21 Grafana boards for everything

Prometheus now scrapes every container. One board per service, one overview board for the whole box.

## 2026-09-21 (2)

A second entry on the same day. It keeps its own anchor and feed item.

## 2026-03-02 Day one: everything is a shell script

Inventory of what runs today and how badly. The plan:

- one compose file per service
- secrets out of the repo
- backups that I have actually restored from
