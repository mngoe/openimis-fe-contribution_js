# openIMIS Frontend Template module

**This module will be deprecated and should not be further developed.**

This repository holds the files of the openIMIS Frontend Template module.
It is dedicated to be bootstrap development of [openimis-fe_js](https://github.com/openimis/openimis-fe_js) modules, providing an empty (yet deployable) module.

Please refer to [openimis-fe_js](https://github.com/openimis/openimis-fe_js) to see how to build and and deploy (in developement or server mode).

The module is built with [rollup](https://rollupjs.org/).
In development mode, you can use `yarn link` and `yarn start` to continuously scan for changes and automatically update your development server.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/openimis/openimis-fe-template_js.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/openimis/openimis-fe-template_js/alerts/)

## Main Menu Contributions
None

## Other Contributions
* `core.Router`: registering `policy/contributions` routes in openIMIS client-side router
* `insuree.MainMenu`:

   **Contributions** (`menu.contributions` translation key), pointing to `//FindPremium.aspx` legacy openIMIS (via proxy page)

## Available Contribution Points
None

## Published Components
//TODO

## Dispatched Redux Actions
//TODO

## Other Modules Listened Redux Actions
None

## Other Modules Redux State Bindings
* `state.core.user`, to access user info (rights,...)
* `state.insuree`, loading insuree policies (,eligibility,...)

## Configurations Options
None