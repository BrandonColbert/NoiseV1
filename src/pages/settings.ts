import {remote} from "electron"
import Noise from "../core/noise.js"

;(document.querySelector("#content > #back") as HTMLElement).onclick = async _ => {
	remote.getCurrentWindow().webContents.goBack()
}

async function bindOption(element: HTMLInputElement, category: string, key: string[]) {
	element.value = key.reduce<any>((v, k) => v[k], await Noise.getSettings()).toString()

	element.addEventListener("input", async e => {
		let target = e.target as HTMLInputElement
		let value = null

		switch(category) {
			case "string":
				value = target.value
				break
			case "number":
				value = target.valueAsNumber
				break
		}

		let settings = await Noise.getSettings()
		key.slice(0, -1).reduce<any>((v, k) => v[k], settings)[key[key.length - 1]] = value
		await Noise.setSettings(settings)

		if(key.length > 1 && key[0] == "theme")
			await Noise.applyTheme()
	})
}

bindOption(document.querySelector(".options #primary"),
	"string",
	["theme", "primary"]
)

bindOption(document.querySelector(".options #primary-variant"),
	"string",
	["theme", "primary-variant"]
)

bindOption(document.querySelector(".options #accent"),
	"string",
	["theme", "accent"]
)

bindOption(document.querySelector(".options #accent-variant"),
	"string",
	["theme", "accent-variant"]
)

bindOption(document.querySelector(".options #background"),
	"string",
	["theme", "background"]
)

bindOption(document.querySelector(".options #foreground"),
	"string",
	["theme", "foreground"]
)

bindOption(document.querySelector(".options #foreground-variant"),
	"string",
	["theme", "foreground-variant"]
)

bindOption(document.querySelector(".options #text"),
	"string",
	["theme", "text"]
)

bindOption(document.querySelector(".options #recency"),
	"number",
	["fetching", "recency"]
)

bindOption(document.querySelector(".options #threshold-wait"),
	"number",
	["fetching", "thresholdWait"]
)

bindOption(document.querySelector(".options #threshold-abort"),
	"number",
	["fetching", "thresholdAbort"]
)