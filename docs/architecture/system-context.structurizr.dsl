workspace "Portfolio OS" "Current-state architecture of two-am-portfolio-os: a framework-free ES-module browser desktop simulation with statically generated content pages. Evidence model: docs/architecture/architecture-model.json." {

  model {
    visitor = person "Site Visitor" "Opens the desktop simulation or a shared content page in a browser."
    owner = person "Site Owner" "Authors projects and writing content in scripts/data/content.js and maintains the repo."

    portfolioOs = softwareSystem "Portfolio OS" "Single-page desktop simulation and generated content pages, served as static files." {
      appShell = container "App Shell" "index.html entry with boot/desktop roots, icon templates, and 10 CSS layers (tokens, shell, boot, icons, folders, windows-mode, macos-mode, environment, windows, apps, responsive)." "HTML / CSS"

      desktopKernel = container "Desktop Kernel" "Composition root (main.js), boot sequence, desktop surface with windows/macos mode detection, window manager, and the frozen app registry." "JavaScript (ES modules)"

      apps = container "App Renderers" "Projects, Writing, About, Contact, Settings, Photos, Albums renderers plus desktop folders, pixel-art SVG helper, placeholder, and three.js wireframe preview." "JavaScript / DOM / Canvas 2D"

      environment = container "Environment Renderer" "ASCII-density terrain canvas with capability detection, music deck, and jacket map." "JavaScript / Canvas 2D"

      contentPages = container "Content Pages" "Standalone generated pages: content-page dispatches by data-content-kind to article-page and project-page." "Static HTML / JavaScript"

      staticGenerator = container "Static Generator" "Node build script that renders writing|projects/<slug>/index.html, emits content-pages.manifest.json, and supports --check validation." "Node.js"

      contentData = container "Content Data" "Source of truth for projects, articles, about, and contact channels with localized labels L(en, zh-CN, ja)." "JavaScript module"

      mediaCatalog = container "Media Catalog" "Track and photo metadata with pixel covers; wav audio assets under media/music." "JavaScript module / WAV"

      i18n = container "i18n" "Locale-aware dictionary lookup with subscription; en, zh-CN, ja dictionaries." "JavaScript module"

      routing = container "Content Routes" "Validates content kinds and slugs, builds content paths, and reads ?open= desktop targets." "JavaScript module"

      preferences = container "Preferences" "Versioned, validated load/save of user preferences; locale resolution from storage or browser languages." "JavaScript / localStorage"

      audio = container "Audio Service" "Synthesized UI cues (boot, click, window, notice) with lazy AudioContext." "WebAudio API"

      threeVendor = container "three.js (vendored)" "Local vendored three.module.min.js, dynamically imported by wireframe previews." "JavaScript"

      localStore = container "localStorage" "Browser storage for the portfolio-os:preferences key, schema version 1." "Browser Storage"

      appShell -> desktopKernel "Loads module entry" "in-process"
      desktopKernel -> apps "Registers 7 renderers" "in-process"
      desktopKernel -> environment "Syncs terrain with desktop mode" "in-process"
      desktopKernel -> i18n "Localizes UI" "in-process"
      desktopKernel -> routing "Resolves ?open= deep link" "in-process"
      desktopKernel -> preferences "Reads and persists state" "in-process"
      desktopKernel -> audio "Plays UI cues" "WebAudio"
      apps -> contentData "Renders projects, articles, about, contact" "in-process"
      apps -> mediaCatalog "Albums and photos metadata" "in-process"
      apps -> routing "Builds content page links" "in-process"
      apps -> environment "Shared deck timecode formatter" "in-process"
      apps -> threeVendor "Dynamic import for wireframes" "in-process"
      environment -> contentData "Terrain seeds from projects" "in-process"
      environment -> mediaCatalog "Deck tracks and jacket map" "in-process"
      contentPages -> contentData "Renders article and project bodies" "in-process"
      contentPages -> i18n "Localizes generated pages" "in-process"
      contentPages -> routing "Back links to desktop view" "in-process"
      contentPages -> preferences "Locale and preference access" "in-process"
      contentPages -> threeVendor "Wireframe preview canvas" "in-process"
      staticGenerator -> contentData "Build-time content source" "in-process"
      staticGenerator -> routing "Owns output routes" "in-process"
      staticGenerator -> contentPages "Writes generated HTML" "file"
      preferences -> localStore "Reads and writes portfolio-os:preferences" "browser-storage"
    }

    githubPages = softwareSystem "GitHub Pages" "Static hosting for the repository root, including the app shell and generated content pages." "HTTP"

    visitor -> portfolioOs "Opens the desktop simulation" "HTTP"
    visitor -> contentPages "Opens a shared article or project page" "HTTP"
    owner -> portfolioOs "Edits content data and regenerates pages" "CLI / git"
    githubPages -> portfolioOs "Serves repository root" "HTTP"
  }

  views {
    systemContext portfolioOs "system-context" {
      include *
      autolayout tb
    }

    container portfolioOs "container-view" {
      include *
      autolayout tb
    }

    theme default
  }
}
