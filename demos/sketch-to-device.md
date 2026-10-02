# Sketch to device: a .NET bot launch

A mini demo of going from an idea, to a shared sketch, to a XAML change,
to inspecting and interacting with the running app. Paste each prompt as a
separate chat message and wait for it to finish.

Allow about 10-15 minutes. Assume the SDKs, plugins, DevFlow broker, and Android
emulator are ready, and builds have been warmed up just before the demo.
Use `demos\MauiXamlDemo`, not the Blazor demo.

Start from a clean checkout of the standard XAML template. The prompts build
the animation during the demo; no animation implementation or rocket asset
is included beforehand.

## 1. Start with an ask, not an implementation

```text
I need to make some changes to my XAML app.
```

**What to show:** Copilot asks for the missing requirement instead of guessing
which screen or behavior to change. Answer its question with:

```text
Can I sketch it instead?
```

**What changes:** A shared drawing board opens beside chat. No app code needs
to change yet.

## 2. Draw the transition

Draw two simple frames on the board:

- Left: a submarine, with an arrow pointing down-left out of the frame.
- Right: a rocket, with an arrow entering from the bottom-left.

In **Notes for Copilot**, write:

```text
The submarine is the .NET 10 bot.
The rocket is the .NET 11 bot.
Tap the bot image to play the transition.
```

Then paste:

```text
Please build this.
```

**What to show:** Copilot reads the saved drawing and notes, not just the
description in chat. Confirm its interpretation in the question UI.

## 3. Turn the sketch into the app

```text
Make that animation play when I click the bot image, and let me click
again to replay. Pause 1s first and keep it slow. Use the rocket from
MAUI's net11.0 template. Run it on Windows.
```

**What to show:** A short, ordinary request turns the sketch into a running app.
We have not prescribed how to arrange or animate its image controls.

**Expected:** The app opens with a stationary submarine and waits for a click.
Nothing animates while you arrange the Inspector.

## 4. Inspect the first attempt

```text
Open the MAUI Inspector beside chat and show me the app's live UI tree.
Find the bot images and their parent. What are their bounds, visibility,
and clipping settings? Don't change anything yet.
```

**What to show:** Expand the image container. In a two-image implementation,
look at the submarine and rocket controls, including the hidden one. Compare
the parent bounds with the area the images need to move through. Shell has its
own images, so focus on the welcome content rather than counting the whole tree.

With the Inspector open and the app settled, click the bot image yourself,
or paste:

```text
Click the bot image so we can watch the animation with the Inspector open.
```

**Expected:** One-second pause, submarine out, rocket in, then a stationary
rocket. Click again to replay without rebuilding or restarting the app.
The text and counter do not move.

If the animation visibly clips, paste:

```text
The moving image gets cut off before it reaches the page edge.
Can you use the Inspector to see why?
```

**Expected:** Copilot correlates the moving image with its parent's clipping
and bounds. The first attempt may have two persistent images in a small clipped
container. Inspect the actual tree and movement; do not introduce a bug just
to match the demonstration.

## 5. Refine the animation

```text
Use a temporary image for the animation and keep the main image still.
Let the temporary one go off the page without clipping, swap both to
the rocket while it's offscreen, then show the main image and remove
the temporary one when it settles. Run it so we can see it.
```

**What to show:** This is a follow-up based on what we saw, not a long
implementation specification in the initial ask. The temporary image should
move across the page while the main image keeps the layout stable.
After the rebuild, reconnect the Inspector and click the bot image to play.

Once it settles, paste:

```text
Check the live tree again. Is the main rocket fully visible and back
at zero translation? Has the temporary image actually been removed?
```

**Expected:** The main image has rocket artwork, opacity 1, and zero X/Y
translation. The animation overlay has no remaining children. Reconnect the
Inspector to the new app instance after the restart; old element IDs are stale.

## 6. Make a reversible live change

```text
Using DevFlow live property editing, temporarily set the main bot image's
Opacity to 0.35. Read the property back to verify it, and leave it there
so I can show the audience. Do not modify XAML or C#.
```

**Expected:** The rocket becomes translucent immediately, without a rebuild.
The value is a runtime change, not a source edit.

Then paste:

```text
Restore the main bot image's Opacity to 1 and verify it. Through DevFlow,
tap the counter button twice, then assert that its live Text property is
"Clicked 2 times". Use the running app, not an assignment to the Text
property or an inference from chat. Do not edit code.
```

**Expected:** The rocket returns to full opacity and the counter reaches two.
Use the fresh Windows launch from step 5, without earlier counter clicks.

## 7. Move the same app to Android

```text
Run this version on our Android emulator and open the Mobile Device
canvas. Wait for the app to settle, then tap the bot image to play
the animation.
```

**Expected:** The same tap-triggered transition runs in the phone-sized layout.
The Android counter starts at "Click me"; it does not inherit the Windows count.

## 8. Mobile task: taps and app lifecycle

```text
Tap the Android app's button three times and check the count.
Then press Home and reopen the app without restarting it.
Is the count still three? Take a screenshot.
```

**What to show:** Copilot physically interacts with the emulator through Mobile
Device tools. Three taps change app state; backgrounding and returning preserves
that state. Returning to the app does not trigger the animation.

Then paste:

```text
Now fully restart the Android app. Check that the button resets to
"Click me" and the submarine stays still until tapped. Don't wipe its data.
```

**Expected:** A cold restart creates a new page and resets this in-memory
counter. It waits on the submarine again. This contrasts a warm return with
a new app process without wiping any stored data.

## Presenter recovery

If you miss the animation, paste:

```text
Tap the Android bot image to replay the animation. No restart needed.
```

If the Inspector stops updating after a restart, paste:

```text
Rediscover the running Windows XAML app's DevFlow agent and reconnect
the Inspector. Read a fresh UI tree; the old connection and element IDs
may no longer be valid. Do not rebuild or edit code.
```

If an Android deployment fails, have Copilot inspect the app's logs and crash
report before changing settings. A previous .NET 10 fast-deployment cache can
shadow the embedded .NET 11 assemblies. The agent's troubleshooting guidance
lives in [Copilot instructions](../.github/copilot-instructions.md).
Do not clear all app data as a generic recovery step.
