defmodule Optitrue.Router do
  use Optitrue.Web, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug Plug.Static, 
      at: "/static", from: :optitrue
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", Optitrue do
    pipe_through :browser # Use the default browser stack

    get "/", PageController, :index
    get "/angv", PageController, :angv
  end

  # Other scopes may use custom stacks.
  # scope "/api", Optitrue do
  #   pipe_through :api
  # end
end
