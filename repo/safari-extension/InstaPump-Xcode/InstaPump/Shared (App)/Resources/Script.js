function show(platform, enabled, useSettingsInsteadOfPreferences) {
    document.body.classList.add(`platform-${platform}`);

    if (platform === 'mac' && useSettingsInsteadOfPreferences) {
        // Update text for macOS 13+ which uses "Settings" instead of "Preferences"
        const stateOn = document.querySelector('.platform-mac.state-on p');
        const stateOff = document.querySelector('.platform-mac.state-off p');
        const stateUnknown = document.querySelector('.platform-mac.state-unknown p');
        const openBtn = document.querySelector('.platform-mac .open-preferences');

        if (stateOn) stateOn.innerHTML = "InstaPump is <strong>enabled</strong>. Open Instagram Reels to start!";
        if (stateOff) stateOff.textContent = "InstaPump is currently off. Enable it in Safari Settings → Extensions.";
        if (stateUnknown) stateUnknown.textContent = "Enable InstaPump in Safari Settings → Extensions.";
        if (openBtn) openBtn.textContent = "Open Safari Settings…";
    }

    if (typeof enabled === "boolean") {
        document.body.classList.toggle(`state-on`, enabled);
        document.body.classList.toggle(`state-off`, !enabled);
    } else {
        document.body.classList.remove(`state-on`);
        document.body.classList.remove(`state-off`);
    }
}

// Button handlers
function openPreferences() {
    webkit.messageHandlers.controller.postMessage("open-preferences");
}

function openSettings() {
    webkit.messageHandlers.controller.postMessage("open-settings");
}

function openInstagram() {
    webkit.messageHandlers.controller.postMessage("open-instagram");
}

// Attach event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // macOS: Open Safari Extensions Preferences
    const prefBtn = document.querySelector(".open-preferences");
    if (prefBtn) {
        prefBtn.addEventListener("click", openPreferences);
    }

    // iOS: Open Settings app
    const settingsBtn = document.querySelector(".open-settings");
    if (settingsBtn) {
        settingsBtn.addEventListener("click", openSettings);
    }

    // Both: Open Instagram Reels
    const instagramBtns = document.querySelectorAll(".open-instagram");
    instagramBtns.forEach(function(btn) {
        btn.addEventListener("click", openInstagram);
    });
});
