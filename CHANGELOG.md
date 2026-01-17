# [1.1.0](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/compare/v1.0.0...v1.1.0) (2026-01-17)


### Bug Fixes

* **env:** actualizar variables de entorno para el servicio de Expenses ([4d3acba](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/4d3acba8aa25e569a1f38215817a056db15de075))
* **jwt:** mejorar la verificación de tokens JWT para incluir la validación del ID de clave ([93c20d2](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/93c20d2c5e84f605fcbec897199af757fc9109a1)), closes [#2](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/issues/2)
* update DATABASE_URL in CI workflow and pnpm files for consistency ([65b7363](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/65b73635e48036a6ace59cae95eabb47283a303e))
* update DATABASE_URL in release CI workflow for test environment ([c87232a](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/c87232a4bef2be81ec3542aad77516cf55b02bac))


### Features

* **auth:** implement JWT verification and authorization middleware ([3ac7565](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/3ac75652bae90dbf051e267c86fc08282c33a233))
* **ci:** update CI workflows to generate Prisma Client and set up Docker Compose ([fd916f0](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/fd916f096319877b7166f585e2508db1ce612e03))
* **ci:** update test commands in CI workflows to use test:ci script ([b64102d](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/b64102d10f90bbef60b1ae6c466fb5d2081910a2))
* **database:** add DatabaseHealthChecker service and integrate health checks for expenses table ([0fa543f](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/0fa543f8d85cd5eb05ecd9d592a975e7d2787cb9)), closes [#10](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/issues/10)
* **database:** agregar configuración de conexión y gestión de base de datos con Prisma ([00043da](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/00043dab0549d79ff232261f7d9eb43b269fd11c))
* **database:** agregar configuración de Prisma y crear tabla de gastos en PostgreSQL ([483e8de](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/483e8de8b01f1980ef06b0e53a8b080b73d9f2c4)), closes [#6](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/issues/6)
* **expense:** add property verification in update and delete methods. ([1b37f7d](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/1b37f7deb22d6a79b8ea8ef0817227853d847ad4)), closes [#7](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/issues/7)
* **expense:** implement use case to list expenses with pagination and their DTOs ([e70e2d4](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/e70e2d4053528e8e871ebb41e95c0fbf80d45940)), closes [#8](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/issues/8)
* **expense:** implementar caso de uso para crear gastos y sus DTOs ([e4a8e2f](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/e4a8e2f66ee1e9ef789726bd74733e2bf9008eea))
* **expense:** implementar entidad de gastos y repositorio con Prisma ([42a5de3](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/42a5de30ba59563988a68988f09e338f2a39cf01))
* **tests:** implement integration tests for expenses CRUD with user ownership isolation ([800b88a](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/800b88abc5ed0089d745422ac052712e448399a6)), closes [#9](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/issues/9)

# 1.0.0 (2026-01-13)


### Features

* **project:** clone F0 code from OAuth2 service ([561288b](https://github.com/JRuvalcabaFSD/ByteBerry-Expenses/commit/561288b08766dbcf8e357f22eef04b717384a2da))
