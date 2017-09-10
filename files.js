var aTapes = [
fTapeRead("LADDERS", D64 ("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")),
fTapeRead("SCRAMBLE", D64 ("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")),
fTapeRead("RAMTEST", D64 ("UkFNVEVTVAAAAAAAAAAAAAApssI5AQ0ACiBAPTQ7UC4kMTIiQVRPTUlDIE1FTU9SWSBDSEVDS0VSIicnDQAUIFAuIiAgICAgMDAwMCAwNDAwIDA4MDAgMEMwMCInDQAeIEYuST0wVE8jOUZGRlMuIzEwMDA7UC4mSSc7Ti4NACggRi5ZPTBUTzkNADIgIEYuWD0wVE8zDQA8ICAgWj1ZKiMxMDAwK1gqIzQwMCs5DQBGICAgQj0jODA2NStYKjUrWSojMjANAFAgICBBPSFaDQBaICAgIVo9MDtJRiAhWjw+MDshQj0jOEQ4RjkyMjA7Ry4xMzANAGQgICAhWj0tMTtJRiAhWjw+LTE7IUI9IzhEOEY5MjIwO0cuMTMwDQBuICAgIUI9IzBEMDExMjIwDQB4ICAgIVo9QQ0AgiAgTi4NAIwgTi4NAJYgRU5EDf8=")),
fTapeRead("TEACUPS", D64 ("VEVBQ1VQUwAAAAAAAAAAAAApssL+AQ0AAFAuJDEyInNoaWZ0PUxFRlQgIHJlcHQ9UklHSFQiJyciV0FJVCI7Ri5OPTBUTzIwMDtXQUlUO04uDQABQ0xFQVIwO1M9MDtDPTA7PyNFMT0wDQACUC4kMzAiICAgICBDVVBTICAgICAgIFNDT1JFIicNAARLPTMzMjYwOz9LPTI1NQ0ACEYuQz0wVE81MA0AClA9QS5SLiUzMiszMjgzMg0AFEYuVD0wVE8xMztMPVQqMzIrUA0AFUlGPyNCMDAyJjY0PTA7Sz1LKzE7P0s9MjU1Oz8oSy0xKT0xOTI7SUYgSz0zMzI3OTtLPUstMQ0AFklGPyNCMDAxJjEyOD0wO0s9Sy0xOz9LPTI1NTtLPzE9MTkyO0lGIEs9MzMyNDg7Sz1LKzENABc/MzMyNDg9MTkyOz8zMzI3OT0xOTINABlXQUlUO1dBSVQ7V0FJVA0AHj9MPTEyMzs/KEwtMzIpPTE5Mg0AI0lGIEw+MzMyNDc7P0w9MTkyDQAoTi4NAC1JRiBLPUw7UC4kNztTPVMrMTs/MzI3OTA9Uy8xMCs0ODs/MzI3OTE9UyUxMCs0OA0ALj8zMjc3OD1DLzEwKzQ4Oz8zMjc3OT1DJTEwKzQ4DQAwTi47RS4N/zENAHhJRj8jODA9Mzg7RT0tMQ0AjElGIFo9Izk0NDk7UC4kMQ==")),
fTapeRead("PLANET.BBC", D64 ("UExBTkVULkJCQwAAAAAAAAAII6DtAA0ACg4g9CBQTEFORVRTDQAUGCD0IENSRUFUSVZFIEdSQVBISUNTDQAeCCDrIDANACgSIEElPTY0MDpCJT01MTINADILIFMlPTUwMA0APA8gSyU9UyUqUyUrMQ0ARhYg4yBZJT0tUyUguCBTJSCIIDUNAFATIFglPbYoSyUtWSUqWSUpDQBaDCBaJT1YJSoyDQBkFiDjIEklPS1YJSC4IFglIIggNQ0Abh8gTCU9MDrnIJSzKFolKS1YJTxJJSCMIEwlPTENAHgfIPAoNjktTCUqMiksKEklK0ElKSwoWSUrQiUpDQCCCCDtOu0N/w=="))
];
