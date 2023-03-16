{
	"targets": [
		{
			"target_name": "addon",
			"conditions": [
				[
					'OS=="win"',
					{
						"libraries": [
							"kernel32.lib",
							"winmm.lib"
						],
						"sources": ["main_win.cpp"]
					}
				],
				[
					'OS=="linux"',
					{
						"sources": ["main_linux.cpp"]
					}
				]
			]
		}
	]
}