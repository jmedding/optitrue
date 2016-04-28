ExUnit.start

Mix.Task.run "ecto.create", ~w(-r Optitrue.Repo --quiet)
Mix.Task.run "ecto.migrate", ~w(-r Optitrue.Repo --quiet)
Ecto.Adapters.SQL.begin_test_transaction(Optitrue.Repo)

