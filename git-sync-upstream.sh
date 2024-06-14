#!/bin/bash

git remote add upstream https://github.com/permaweb/ao.git

git fetch upstream

git pull --rebase upstream main

if [ $? -ne 0 ]; then
  echo "Conflict detected. Running git status to get the list of files to remove."

  git_status_output=$(git status)

  deleted_files=$(echo "$git_status_output" | sed -n 's/^        deleted by them: \(.*\)$/\1/p')
  echo "List of files deleted by them:"
  echo "$deleted_files"

  for file in $deleted_files; do
    git rm "$file"
  done

  git rebase --continue

  echo "Files have been listed. Please resolve conflicts and continue the rebase."
else
  echo "Rebase completed successfully."
fi

# git push origin main --force