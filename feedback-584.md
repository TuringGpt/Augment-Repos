# Review Feedback
pr: 584

## 3086282659
path: augment-store/server/merchant/tests.py
line: 120
url: https://github.com/TuringGpt/Augment-Whisper-Slackbot/pull/584#discussion_r3086282659
author: augmentcode[bot]
thumb: 
value: useful
category: bug
feedback: Chose 'useful' because this is a real correctness issue in the new regression test and needed fixing before merge, but it is the kind of mistake a normal review would likely catch.
 The comment points out that `django.utils.timezone` has no `timedelta`, so the test would raise `AttributeError` instead of verifying ordering behavior.
status: fixed
original: `django.utils.timezone` doesn’t provide `timedelta`, so `timezone.timedelta(...)` will raise an `AttributeError` and fail the test run; this should come from `datetime` instead.  **Severity: high**  [![Fix This in Augment](https://public.augment-assets.com/code-review/fix-in-augment.svg "Fix This in Augment")](https://app.augmentcode.com/open-chat?mode=agent&prompt=%23%23%20Review%20Comment%20Fix%20Request%0A%0APlease%20help%20me%20address%20this%20specific%20review%20comment%20from%20PR%3A%20https%3A%2F%2Fgithub.com%2FTuringGpt%2FAugment-Whisper-Slackbot%2Fpull%2F584%0A%0A%23%23%23%20Review%20Comment%3A%0A-%20%2A%2AGitHub%20Comment%20ID%2A%2A%3A%203086282659%0A%0A%23%23%23%20Steps%20to%20Follow%3A%0A%0A1.%20%2A%2ADetermine%20Github%20Branch%2A%2A%3A%20Use%20%60git%20branch%20--show-current%60%20to%20get%20the%20current%20branch%2C%20then%20fetch%20PR%20details%20from%20the%20Github%20API%20to%20determine%20the%20correct%20branch%20for%20this%20PR%0A2.%20%2A%2ABranch%20Verification%2A%2A%3A%20Ask%20the%20user%20to%20switch%20branches%20if%20they%20are%20not%20on%20the%20correct%20branch%0A3.%20%2A%2AFetch%20Comment%2A%2A%3A%20Fetch%20the%20review%20comment%20details%20from%20the%20GitHub%20API%20using%20the%20comment%20ID%20above%0A4.%20%2A%2AAddress%20Comment%2A%2A%3A%20Help%20me%20fix%20the%20issue%20described%20in%20the%20review%20comment%0A%0APlease%20start%20by%20checking%20the%20current%20branch%20and%20PR%20details.)   <h2></h2>  <sub>🤖 Was this useful? React with 👍 or 👎, or 🚀 if it prevented an incident/outage.</sub>
