# 🌱 envsync - WORK IN PROGRESS ❗

A simple and secure CLI tool to **sync, manage, and share `.env` files** across projects and teams — powered by GitHub login and cloud backup.

![envsync-banner](https://img.shields.io/badge/envsync-CLI-green)
*Developed with ❤️ by [Pragun](https://github.com/Pragun-4u)*

---

## 🚀 Features

* 🔐 GitHub-based authentication
* 🧪 Interactive `init` to configure multiple `.env` files
* 🔁 `push` command to securely upload your `.env` to the cloud
* 📅 `pull` command to retrieve any env profile anytime
* ⚙️ Supports multiple profiles per project (e.g., `dev`, `prod`, `staging`)
* 🧠 Smart `.envsync.json` config with project and profile mapping
* 📁 Works with monorepos (e.g., Turborepo, Nx, Lerna)

---

## 📦 Installation

```bash
npm install -g envsync
```

---

## 🔑 Authentication

```bash
envsync login
```

This will open a browser window where you can log in using your GitHub account. Credentials are stored locally in `~/.envsync/config.json`.

---

## 🛠️ Commands

### 1. `envsync init`

Configure your project for envsync.

```bash
envsync init
```

* Detects `.env.*` files in your project
* Asks you to give short names (aliases) like `dev`, `prod`, `cli`, etc.
* Generates a `.envsync.json` like:

```json
{
  "projects": {
    "my-cli-project": {
      "main-env": ".env",
      "dev-env": ".env.dev",
      "cli-env": "src/cli/.env.cli"
    }
  },
  "defaultProject": "my-cli-project",
  "defaultProfile": "main-env"
}
```

---

### 2. `envsync push --profile <alias>`

Push a `.env` file to the cloud.

```bash
envsync push --profile dev-env
```

---

### 3. `envsync pull --profile <alias>`

Download a specific `.env` profile and write it back to disk.

```bash
envsync pull --profile cli-env
```

---

### 4. `envsync whoami`

Check your current GitHub login.

```bash
envsync whoami
```

---

### 5. `envsync logout`

Logout from GitHub and clear local session.

---

## 📁 Config File

Your `.envsync.json` file defines your projects and profiles:

```json
{
  "projects": {
    "my-project": {
      "dev": ".env.dev",
      "prod": ".env.prod"
    }
  },
  "defaultProject": "my-project",
  "defaultProfile": "dev"
}
```

---

## 🧠 Ideal Use Cases

* You use multiple machines and want consistent `.env` access
* You're in a team and want secure `.env` sharing
* You use monorepos with multiple `.env` files

---

## 🔐 Security

* Your `.env` files are **never stored in GitHub**.
* Data is synced to your private backend (you control this).
* Authentication is done securely using OAuth with GitHub.

---

## 📌 Roadmap

* [x] GitHub login
* [x] Local config store
* [x] `init`, `push`, `pull`, `logout` commands
* [ ] Encrypted `.env` storage
* [ ] Team support / access control
* [ ] S3 / Firebase / Supabase backend options

---

## 🤝 Contributing

Pull requests welcome! Please open an issue first for any big changes.

---

## 📄 License

MIT License
