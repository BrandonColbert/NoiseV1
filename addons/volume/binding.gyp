{
	"targets": [
		{
			"target_name": "addon",
			"sources": ["main.cpp"],
			"conditions": [
				[
					'OS=="win"',
					{
						"libraries": [
							"kernel32.lib",
							"winmm.lib"
						]
					}
				]
			]
		}
	]
}