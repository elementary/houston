Create a readable Debian control file

AppHub was unable to parse your `debian/control` file. Please check it for
formatting errors.

Here is the error we received when trying to parse it:
```
{{ data }}
```

Here is a short sample of what a simple `debian/control` file would look like:
```
Source: com.github.owner.repo
Maintainer: Maintainer Person <maintainer@email.com>
Section: sound
Priority: optional
Standards-Version: 3.0.4
Build-Depends: cmake (>= 2.8),
               debhelper (>= 8.0.0),
               libgee-0.8-dev,
               libgranite-dev,
               libgtk-3-dev (>= 3.14),
               valac (>= 0.18.1)

Package: com.github.owner.repo
Description: Repo
 A super amazing project.
```
