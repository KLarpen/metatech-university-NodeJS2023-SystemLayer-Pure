# Metatech University. NodeJS 2022-2023 System layer on pure Node.js
Part of educational project in [Metatech University](https://github.com/metatech-university/)'s NodeJS 2022-23 course. This repository contains code of the system layer built using pure Node.js functionality. It can launch application layer from different repository (e.g. it's sibling folder) based on configuration: relative path to its folder declared in the `.applications` file.

The `.applications` file excluded from commit into git repository. The `.applications.example` file had been placed instead which contains reference to the domain layer folder as an example. To launch the system you should rename example file to just `.applications` or place in the root folder your own `.applications` file (_it considered that domain layer folder already exists on the runner machine_).

The available domain layer repositories:
- [metatech-university-NodeJS2023-Application-metaschema](https://github.com/KLarpen/metatech-university-NodeJS2023-Application-metaschema).

The code is considered as the next step of progressive development of the project `d-tasks2-messenger` from [metatech-university-NodeJS2022-homework](https://github.com/KLarpen/metatech-university-NodeJS2022-homework/tree/main/JavaScript/d-tasks2-messenger) repository. Specifically as result of splitting layers into separate repositories: system and application itself. The logic behind the splitting decision is to provide ability to use the same system layer as a runner for different domain applications (i.e. application server).
