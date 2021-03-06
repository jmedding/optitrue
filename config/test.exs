use Mix.Config

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :optitrue, Optitrue.Endpoint,
  http: [port: 4001],
  server: false

# Print only warnings and errors during test
config :logger, level: :warn

# Configure your database
config :optitrue, Optitrue.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: "optitrue_test",
  password: "optitrue",
  database: "optitrue_test",
  hostname: "localhost",
  pool: Ecto.Adapters.SQL.Sandbox
