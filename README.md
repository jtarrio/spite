# Project Spite (HTML5 Second Reality remake)

This is my unfinished HTML5 remake of Future Crew's
[Second Reality](https://en.wikipedia.org/wiki/Second_Reality) demo. I wanted
to make it in time for the 30th anniversary in July 2023, but I realized that,
as I don't have experience writing demos, I won't have time to finish it.

Therefore, here is the second best thing: I release what I have so far, you
enjoy it and, hopefully, you'll feel inspired to continue work on it.

* [See it in action](https://jacobo.tarrio.org/assets/2022/spite/index.html).
* [See the blog post](https://jacobo.tarrio.org/2022/project-spite.html).

## How to build

You'll need NPM and a Linux environment to build Project Spite. MacOS might
work; I haven't tested it. I use the Windows Subsystem for Linux, so we know
for sure that it works. I have tried to make the build scripts work well with
paths that contain spaces, but be cautious.

To build, use the command:

```shell
$ util/build.sh
```

The compiled files will be in the `out/` subdirectory.

You can also try it out without building; just start a server on the root
directory of this project and browse to it.

## Assets and credits

Second Reality was made by Future Crew, and its source code
[was released](https://github.com/mtuomi/SecondReality) in 2013 under the
[Unlicense](https://github.com/mtuomi/SecondReality/blob/master/UNLICENSE).
The music and the 3D models for the ships were extracted and reused from the
Second Reality source code.

Project Spite uses [three.js](https://threejs.org/) for the 3D scene.

The font used in the credits is called "SR serif" and is based on
[Merriweather](https://github.com/SorkinType/Merriweather/), with the addition
of a ligature for "Dolby Surround".

All the code was written by me.

Regards to Fabien Sanglard for his
[review of the Second Reality source code](https://fabiensanglard.net/second_reality/)
and to Brett Paterson (FireLight) for his
[MOD and S3M player tutorials](lib/s3mplayer/docs).

