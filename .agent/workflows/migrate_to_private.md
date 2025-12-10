---
description: How to detach a fork and make it private
---
# Migrating Fork to Private Repository

Since GitHub does not allow changing the visibility of a fork, you must duplicate the repository to a new private one.

## Prerequisites
1.  **Create a new private repository** on GitHub (e.g., `base-cartel-private`). **Do not initialize it** with README, license, or gitignore (it must be empty).

## Steps

1.  **Update Remote URL**: verify your local repository points to the new private repo.
    ```bash
    git remote set-url origin <NEW_PRIVATE_REPO_URL>
    ```

2.  **Push Code**: Push your code to the new repository.
    ```bash
    git push -u origin master
    ```

3.  **(Optional) Delete Old Fork**: Go to the settings of the old public fork on GitHub and delete it to avoid confusion.
