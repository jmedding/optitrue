defmodule Optitrue.PageController do
  use Optitrue.Web, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end 

  def angv(conn, _params) do
    render conn, "angv.html"
  end

  def cam(conn, _params) do
    render conn, "cam.html"
  end
end
