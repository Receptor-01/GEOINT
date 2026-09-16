# GEOINT across Windows and Mac

Repository: https://github.com/Receptor-01/GEOINT (private)

## Windows: use this working copy

The GitHub working copy is `C:\Users\andre\GitHub\GEOINT`.
The earlier `C:\Users\andre\OneDrive\Documents\CASE PREP` folder is retained as a separate copy; editing it will not update this repository.

Open the GitHub copy as your coding project for future edits. In GitHub Desktop, choose File → Add local repository and select this folder if it is not already listed.

Your currently installed Windows extension may still load from the earlier folder. To use the GitHub copy, open `chrome://extensions` (or `brave://extensions`) and use Developer mode → Load unpacked → select this working copy. A different folder can create a separate extension installation with separate local history. Disable the old GEOINT while trying the new one; leave it installed if you want to retain access to its history.

## Mac: clone and install once

1. Sign into GitHub Desktop with the account that has access to the private repository.
2. Choose File → Clone repository → URL.
3. Enter `https://github.com/Receptor-01/GEOINT`.
4. Choose a permanent local path such as `/Users/YOUR-NAME/GitHub/GEOINT`, outside cloud-sync folders.
5. Click Clone.
6. In Chrome, open `chrome://extensions`, turn on Developer mode, click Load unpacked, and select that cloned folder containing `manifest.json`.
7. Pin GEOINT, click its icon, then OPEN GEOINT.

## Each time you edit

1. In GitHub Desktop, select GEOINT and Fetch origin / Pull origin before editing.
2. Edit the local GitHub working copy and test the extension.
3. Review Changes in GitHub Desktop. Enter a short summary and Commit to main.
4. Click Push origin to upload the committed changes.
5. On the other computer, Fetch origin / Pull origin.
6. Reload GEOINT at the browser's extensions page and reopen its dashboard.

GitHub Desktop does not automatically publish uncommitted edits or reload Chrome. Avoid editing the same files on both computers simultaneously. If a merge conflict occurs, resolve it before continuing or ask your coding assistant for help.

## What is shared

Code, bundled reference data, icons, flags, and silhouettes are versioned together. Browser search history, cached coordinates, downloaded screenshots, and installed extension state remain local to each browser.

The Python tools are included for maintenance, but their large `data/raw` inputs are excluded. Those inputs remain in the earlier Windows project folder and must be supplied before rerunning builders that depend on them. Running the extension requires neither Python nor those raw files.

The existing Mac ZIP guide remains useful for ZIP-based installation; use the clone workflow above for ongoing GitHub updates.
