# scoreboard

[![codecov](https://codecov.io/gh/tailuge/scoreboard/graph/badge.svg?token=70UENFYO7P)](https://codecov.io/gh/tailuge/scoreboard)
[![CodeFactor](https://www.codefactor.io/repository/github/tailuge/scoreboard/badge)](https://www.codefactor.io/repository/github/tailuge/scoreboard)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=tailuge_scoreboard&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=tailuge_scoreboard)
[![Tests](https://github.com/tailuge/scoreboard/actions/workflows/main.yml/badge.svg)](https://github.com/tailuge/scoreboard/actions/workflows/main.yml)

[scoreboard](https://scoreboard-tailuge.vercel.app/leaderboard.html) and [lobby](https://scoreboard-tailuge.vercel.app/lobby) for [tailuge/billiards](https://github.com/tailuge/billiards) running on [vercel.com](https://vercel.com/tailuges-projects/scoreboard) with [nchan](https://billiards-network.onrender.com/) running on render.com.

This project is a work in progress experiment to get AI LLMs to code a complex task. About half the code is generated by combinations of github copilot, gpt4o, claude, cline, deepseek, gemini-flash-thinking and even [webarena](https://web.lmarena.ai/).

I have to intervene and untangle things now and then but these tools allowed me to get away with minimal understanding of react and nextjs. I am blown away with it all - could never have imagined this a couple of years ago. It is a thrill to witness these advances (being put use to nonsense).

## dev

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/tailuge/scoreboard)

```shell
yarn dev
yarn deps
yarn build
yarn prettify
yarn serve
yarn docker:build
yarn docker:push
```

## test

```shell
yarn test
yarn coverage
```
[multi lobby](https://scoreboard-tailuge.vercel.app/test.html)

[usage](https://scoreboard-tailuge.vercel.app/usage.html)
