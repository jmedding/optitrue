# Optitrue

This is a work in progress and is not functioning in any useable way at the moment.

The goal is to be able to point your smartphone camera at the wheel of your bike while it is spinning around and measure the distortions in the vertical and horizontal axis.

The app is currently written in Javascript and runs in the browser, but eventually, it can be ported to IOS and Android once the algortithms are sorted.

So far, the main work has been to measure the wheel displacement in each frame of the video.  Currently we are trying to get a fix on the wheels angular position on a frame by frame basis.

Next steps are to start using the cameral directly (today, it's just recorded videos).

Much work still needed to make everything faster so that it can be real-time.

Finally, it would be great to apply some machine learning techniques to give spoke tensioning recommendations to make the overall time spent trueing the wheel much less.

To start this Elixir Phoenix app:

  * Install dependencies with `mix deps.get`
  * Create and migrate your database with `mix ecto.create && mix ecto.migrate`
  * Install Node.js dependencies with `npm install`
  * Start Phoenix endpoint with `mix phoenix.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

Ready to run in production? Please [check our deployment guides](http://www.phoenixframework.org/docs/deployment).

## Learn more

  * Official website: http://www.phoenixframework.org/
  * Guides: http://phoenixframework.org/docs/overview
  * Docs: http://hexdocs.pm/phoenix
  * Mailing list: http://groups.google.com/group/phoenix-talk
  * Source: https://github.com/phoenixframework/phoenix

