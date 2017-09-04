var
	sAXR1_ROM				= D64("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"),
	sPCHARM_ROM				= D64("QL8gD6bwOq38A4WXogHkBvA0ICulsC0gD6bJPfADTIKmikgg3sRoxiSg+dEj0CPIhJYgbqbmJExbxakrIOilUD5MWMWiHIaToqOGlCDqqKWXoACEloWUsZaFl8iEk4ixk8nj0AYKyNGT8OHohn+pD4V+5n6lfsmg8MeFkqADqQCFkcixkdmto/D4wAvQ5CB+paZ/0BGlfiD697GRIOn/yMkN0PbwzJikkqqGk+ggRKWwwKR+TK2vogWtIQNIjiEDogAgicVojSEDYKJ/pAOxBeYDyQ3wDuidAAHJL9Duiik/hZdgTMbIIMygINaksBMg2cQgMcKwBSDWpLATqf+gf9AJIDHCkPClFqQlhReEJqIBhgQgkfLJVvAFyUzwAYiFYCDnxCAuxrAHIOyvJCChziDcpBilFuUXpSXlJrAchJbmlqSWogDklfAPsVjJDfDd3YAB0OvI6NDtGGAgyqCFlfCCyLEFyS/wFMkN0PUg6qCwCCDupCAtoZD4TMrCoj8g56Cw9iA9orAGIMCuIOikIEChTIKhIA+myS/QBuYDIMqgqoaVIOqgsNEg6KQgcqIgPaKwBaVYIL+hIC2hTKehhVKlWWkAhVOYZViFVqkAhWFlWYVXpQ2FVKUOhVWiVKAAOKVS5VZIpVPlV7AlaJAM5lbQAuZX5lLQAuZTsVaRUiAO+tDrpWHQCKVShQ2lU4UOYGVVhVNoZVSFUrACxlMgBKKxVJFSIA768OalVNACxlXGVKVS0ALGU8ZSTCGipWDJVtA9hGEg7qQg0fdZL04gP6RhIOb/SCDt/2jJWfAiyU7wH8kb8D7JQ/AUyUzwEMlT0NakloSWyLFYyQ3Q92CFYBhgIG2uoP6E0SCYriCnoqXRMAUgSKKwDKAAhNEgp6Kg/yCYrkzKwqUShQagAIQFsQXJDdAIIPbEsQUwxcjIhAOp4CDuqKQDUOYgK68gD6bw4OlhyRqQEoSYogCGBCDWpKXRkBPQAyCdriAPpvDD5gPJLND18NMY8PAg3KSE0SDupPCsL6FbUkVOVU2igkFVVE+vNENPTlSokURFTKGVUkVBRKmGUEVORKclPKA6Q0VORKqMV0hJTEWkOVdFTkSoV1hJRqRSRUxTRamDRkVORKs6QkVFUKfnT04gRVJST1KpXk9OqkpDQVNFqo9DT1BZpK5JQ09QWaSlUE9QqCVLRVmkf0lOS0VZpHxaRVJPqIZWVEFCp9BIVEFCp81EQVRBqYNGVU5DVElPTqXCUFJPQ6XFUFJPR1JBTalrUEFVU0WnvkJTQVZFr9ZWQVKoLkhFWKrCQ0FUoGxDT1OnqVNUT1CotVJFU1RPUkWk/0dPVE+BAEdPU1VC/wCAPq9PRvyufA77re7gVFJVRa25RkFMU0WttklOU1RSrVpOT1StsEVWRU6tqU9ERK2kgCyskYCp1Y0CAqmrjQMCYK3ZA8kKsLCICmlNIDjFIEup8BHu2QNMG8MgS6nwA0xwxaI+LKIxhZeGUqVSIOilUI2lk+VSyQiwBOaX0O3GlxDpMNMglP4gcf6pALALwA2wBMAFsAMgoaRIIDTEkOwg6MRoIHzJTOjDCEyx/iDJpCDcoUxbxSDJpKJUoAAg+6HQ8SCLxyAxwiCLxyAxwkzhxCC6pCDLw6BUhGFMi64gD6ZMasSgAbFYhSXIsViFFmClYMlM0BAgt6Ag3KTIsVgg6f/JDdD2YCAPpvAeICXMIOTEOCDtr6VX0AUgLsawnSDsr6RZhZiEmdCJIPbEICOv8PCXOLEF6UHJGrA1hZNKShhlk6qFk73eKLy9KDjlA4WRmLABiISSpAMK8BaIyLGRyUGQENEF8PXKEAKiIeST0NXIOGDJLfDssQXJQbDqxAPw5oQDiMixkckg8PkYhJRgCghKKR8oEB9IIHLY6GiVFSBL1KBvIM3DoAC5UgCRb8jABdD2pgRgysqoIDfK6IYEYL1/ASCIpdD4YKlJLKkihZYgD6YgK6XQ0KQDIPbEpQWd3iilBp29KCDqpVC/TFjFhZamBsrwKaWWhZOIqQ3I0QXQ+8ixBTAYyCAoxSAPpqnAIPWoUOFgIJHyyTvwA8kNuIQDYKIAsZHJJdAFokDIsZGGkDjpQMkbsFXIhJRIpJamlwWTBZCRI0iYnYABaBAByMiElqYE6AoQCGiVFSAfq7AFaKgg48ggbqbml6SUsZHIySzwr2AgctiklqIEtVKRI8jKEPiElmCmlYpIpJSpAIWThZeFlakDhZaxkcko0FLIsZHJOtAHyGaTppaGlSAcpiSTMATJOvDvySnQ0oSUIJHyySjQyaYEpSNIvIABsSNI5iQg/KrGJGidfwEgMcJoxSPQq+ALsKfkl9DcIEfJILmlpAOIIPbEiISTpZWRI8ilBZEjyKUGkSMgZKaIhAOklqk/kSPIaJEjmBhpBqggeKylkYUFpZKFBkxYxQAgKqfw9yDkxKk/xiSg+NEj0O2g/xilI/EjhSOQAuYkyLEjqLEjECfIhJPoChAMSikflRUgH6upQLAHSqgg48ipAKSTESOdfwGYGGkG0NSGBKABsSOFBcixI4UGhJPIsSPJP/AcSAqQAciiBMixI5VSyhD4hJMgaNhoIIilpJPQ3YpMv6Ug+K8pAaqgA739o5kUAujoiBD1MG0g+K+0JMiqIIf7iND68F6pDSypHkgg4cRoIPT/KQsgQc+IMEkg9P8Q+CDApKkFtBTQApiIhJKUFIWToFgge8aEV6BTIM3DIIzGpVcKJliorQKwyKaSyo0CsOrQ+UWTiNDyxlgQ7jAGpBTwAsYUTFvFmEgJQCBMyqk9IEzKogEg48gguaCkByCd+YQH8AMgVM1oqMjAG9DZ8NSlBkilBUit2QPwIAqqvdgDhQW92QOFBiBLqfAFaGhMG8PO2QNohQVohQYgAMXQpYqia50iA8oQ+jCarfkDxQ3QU+7wA9BOoga98AOVD8rQ+CAupOi99wOVBcoQ+DDaxAbwMiDR9wYKDQdTVE9QIEFUoga1D53wA8rQ+Oi1BZ33A8oQ+KUNjfkDuo7wA4QFqcpM4smpAPAHhZMgD6apQIWVogDmk6QDiMjmk6GTMBvRBfD15pOhkxD6JJUwLsQD8CqxBcku0CTIoZPJgPAmhAMklXAgaGillAl/IZNIyajQAyDkxOaToZNICEBQtqGTyaaQsLhgIA+mySXQBiDr2Uz7ryAMx0z7ryD2xKUFhRClBoUR0BiKor2O8AON2QOdACjo0PogLqSlEoWZhphMdcUgkfLJJfA7ySTwSMjRBfAVxgMgNMSQYiACqiAvyiAxwpDeTFjFIIvwIAKqpgQgls7ItSaRUsi1NZFSyLVEkVJMo6kgRNSQMqLQoPwgBqogNtjwyiCLx6LOoLEgBqqgVCDNw6D/yLFSkVTJDdD38K4gi8ep+SDuqHBKTKzCosegi4bphOilBUilBkilA0ipAIUDpZmFBqWYhQUgMcKQCKmZIOilOFASIOn3IA+mIPbEpQWFmKUGhZkYaIUDaIUGaIUFsMtgILbOtRaFlqnpIPqpIB/MxpbwDSAxwqVX0ALGBLAkkOylk8nv0AVMC8zmAyAPptD5TNXLqSgg6KVQTMmg8MFoaMYETFjFIJHyySTwF8YDIPWpIH2qINrG0Pip9yD6qcYETBvDIPWpIH2qILHOIDfH0OilVJUVTLCqIOHEoFggzcOiWCDx96AAsVgg+vfIwATQ9qAAIP33sVjJf7AEySCwAqkuIPT/yMAE0Okg7f8goc7QzgqwCzADTIvHIPzQTF3YMAYgKKtM4cggkfLJJfADTF3RICirIEvUIODRTF3YIDTEkK+8fwHItRXGJJEj5iRgICqnxiSg/7EjiKqxI0iI6ND5sSOFlPAJIIurpJXklND3ogCIsSOdgAHo4AvQ9eYkhJSlk2kHqCCLqxilI2WUhSOwAsYkaIUPIMat6OiapgRgogCIsSOVUujgBdD2hJVM2cSGlaYEhpegAKIKvYABkSPIyhD3hJamBPAFIG6m0PellyB4rKUPSLrohpdokSPI6ND5pZcgeKxMgKat+wPJs9Bvre4D0Gps7gOiALWRSOjgB9D4hJOppIWUIOqoICulkKCwYqQDsQUwYiD2xMQG8Fsg0fcGBwoNRVJST1IgogClACB8ySC5oCDt/yArr6AAGCDtryD997FYyQ040PMg3KQg0fcgICAqCg3qIO6kTJvNaGiFAGiFkKUAoAPJHfCKoCjJrvCEpRHJyfCYTNzJoAD2FdAC9iS1FZEjtSTIkSOYOGUjhSOQAuYkoACxI0n/kSPRI9D1YLq9DQHJ0/AcvAoBvQgBSL0JAapoyZPwS8l78DjJ8NCv4PDQqyDGrZqlI0imBCBprCCLxyBprCBkxiAWyCAxwpDvIEfJtRXQAtYk1hUYaOUjoADwk+DU0Ma5hyi+oijQDUyE8ODw0Le56wK+BgOFk8qGlKYEIMvD6CChycqGBKD/sZPJ7JDaqLUW0ZPItSXxk8iwzbU0FULQx5jIECOISLGTyIVTsZOFVCByxoRShFWEViAWyCAxwiCLxyCHzWjQxiBHySDGrUyHqyCR8sko0BWiJyAzwuYEIDHCILHOoFggzcOgAKkAhVQ4sVjpDfAdyIRWiIjIIHvWyQ3wCtFY8PSkVtDg8ASlVfACpVZIIEfJaLAaID7PEBIgPs/ITLutID7PmPADoAAsoAGYKQGmBCB8yUyCq7qgB70DAeiZkACI0Pbo6GCiBI4CsGgoaGhgCKXZIGGuqX6FwCC9/JD35sAQ96IUhsSsArAgzfzwAejOxADQ9eAXZsCQ6Ewc/AhIICP8hcCl0CBhriDY/KAKGJAJogeOArCiAdALqQSNArAg2PzuArAg2vw4ZsCI0OG6vQMBKQ9dBAHJ/PCKTLb8pX4YZXqFfqV/ZXuFfxAOTGvEeIbshMPuH4CNHoBgqQqFFoYlhReGJiDWpLAC5gQgMcIg1qQg5MSiAqB6IM3DyMhMzcOkmYQDYIRTyIRwhJkgG6+gAbFYMOvIxVPQM7FYxVLQLSD5riArr6SYhJakmRillmWXZVggv6GklqIA8Ae9QAGRWMjo5JfQ9YiEloQDYKVw0AqIpX+RWMilfpFYIE+uIHSiIKHO0KupQIVSogCgfiChySCByYZTIJ3SqfiFcCDQ1DipCGVwhZdgpXyFfqV9hX+lEoVZqQDwBqUGhVmlBYVYYCBtriAbr4XS8ByF0aWYjQgCpZmNCQJoyRPQWKUlhX+lFiBRrqkAIPuuILegpJem0vAKIHnzmQAByMrQ9oZSIBjNqCB2+ITSuQAByDjpMMkKkPWIxNLwGYTSIHb4mDjl0oXS6L0HApWXvfijnQcCEPJM1cJIpdFsCAKEEiAjr6ggd6LIsVgIyCChzigQ8qVYhQ2FI6VZhQ6FJKYShgaiAEzawiD6zoRYhVmlDYVapQ6FW6mvhVZMH88YpVjpAYVYsALGWWAg4cTGBLUVYA==");
