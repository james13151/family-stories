# Hearthlight Android APK

The Android app is a WebView shell around the hosted site. The phone does not run Next.js, Prisma, Whisper, or the database. Sign-in, stories, speech-to-text, and photographs stay on the server you already run.

Capacitor is used instead of a Trusted Web Activity so the shell does not depend on Chrome or Play Services. That matters for a sideload in mainland China.

The website in a normal browser is unchanged.

## What the APK opens

`CAPACITOR_SERVER_URL` is read when you sync or build. It is copied into the Android project. Changing the URL later means building the APK again.

```bash
npm run android:url
```

If that prints `https://stories.example.com`, the APK still has the placeholder. Do not give that build to the family. Set the real origin first:

```bash
export CAPACITOR_SERVER_URL="https://your.real.host"
npm run android:url
```

`PUBLIC_BASE_URL` is used only when `CAPACITOR_SERVER_URL` is unset and the value is a public `http://` or `https://` origin. `http://127.0.0.1:43123` from `.env.example` is ignored, because a phone cannot open the computer that built the APK.

Use `https`. The microphone (`getUserMedia` / `MediaRecorder`) needs a secure page. An `http://` site may load, but recording can be refused by the WebView.

## Permissions

The shell asks on first launch for:

- microphone, so the site can record speech
- camera, so a photo can be taken when the page asks for one
- photos and audio files (`READ_MEDIA_IMAGES` / `READ_MEDIA_AUDIO` on Android 13+, storage read on older versions)

The site still uses the same browser APIs. Nothing is switched over to a Google speech service or a native rewrite.

## Tools

You need Node.js 22, JDK 17 or 21, and the Android SDK (command-line tools are enough).

```bash
# JDK
sudo apt-get update
sudo apt-get install -y openjdk-21-jdk

# Android command-line tools. Unpack so that sdkmanager lives at
# $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager
export ANDROID_HOME="$HOME/android-sdk"
mkdir -p "$ANDROID_HOME/cmdline-tools"
# Download commandlinetools-linux-*_latest.zip from
# https://developer.android.com/studio#command-line-tools-only
unzip commandlinetools-linux-*_latest.zip -d /tmp/android-cmd
mkdir -p "$ANDROID_HOME/cmdline-tools/latest"
mv /tmp/android-cmd/cmdline-tools/* "$ANDROID_HOME/cmdline-tools/latest/"

yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$ANDROID_HOME" --licenses
"$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$ANDROID_HOME" \
  "platform-tools" "platforms;android-36" "build-tools;36.0.0"
```

`android/variables.gradle` currently compiles against Android 36. If that file names a different platform, install that platform instead.

Put the SDK on your path for the Gradle build:

```bash
export ANDROID_HOME="$HOME/android-sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
```

Gradle also reads `android/local.properties` (`sdk.dir=...`). That file is not committed.

## Debug APK

From the repository root, after `npm install`:

```bash
export CAPACITOR_SERVER_URL="https://your.real.host"
export ANDROID_HOME="$HOME/android-sdk"
npm run android:debug
```

`npm run android:debug` runs `npx cap sync android` and then `./gradlew assembleDebug`.

The APK is:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

A debug APK is signed with the automatic debug key. That is enough to sideload. It is not the key you want for updates you will ship for years.

## Sideload

On the phone: Settings → Security (or Privacy) → allow install from this source. The name of the switch varies. Then open the APK from Files, Drive, or:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

The launcher name is 家燈. The application id is `app.hearthlight.family`.

When the real site is up, rebuild with the new `CAPACITOR_SERVER_URL` and install that APK over the old one (`adb install -r`, or open the new APK on the phone). An update replaces the app only when it is signed with the same key. A debug APK and a later release APK do not share a key unless you planned that, so the family would uninstall the debug build once before installing the release build.

## Release signing

Do this when you are ready to keep one key for future updates. Do not commit the keystore or the passwords.

```bash
keytool -genkeypair -v \
  -keystore "$HOME/hearthlight-release.jks" \
  -alias hearthlight \
  -keyalg RSA -keysize 2048 -validity 10000
```

Create `android/keystore.properties` (gitignored):

```properties
storeFile=/absolute/path/hearthlight-release.jks
storePassword=the-store-password
keyAlias=hearthlight
keyPassword=the-key-password
```

`storeFile` is read from the `android/app` module, so an absolute path is the least confusing.

Then:

```bash
export CAPACITOR_SERVER_URL="https://your.real.host"
npm run android:release
```

The signed APK is `android/app/build/outputs/apk/release/app-release.apk` when the properties file exists. Without that file, `assembleRelease` still runs, but the APK is unsigned and is not what you sideload.

Keep the `.jks` file and the passwords somewhere you can open in a few years. Losing them means the next build cannot update the installed app. The family would have to uninstall first.

## After the domain exists

1. Point the domain at the Hong Kong host and serve the Next.js app over HTTPS.
2. Set `PUBLIC_BASE_URL` on the server to that same `https://` origin (gift-card QR codes).
3. Export `CAPACITOR_SERVER_URL` to that origin, run `npm run android:url` to confirm it, then `npm run android:debug` or `npm run android:release`.
4. Sideload the new APK.

No Play Store listing is required for this.
