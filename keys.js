
var
	bInput = false,
	bShow = false,
	nKeys = 0,

// Key definitions

	CODE_SHIFT = 1,
	CODE_CTRL = CODE_SHIFT + 1,
	CODE_ALT = CODE_CTRL + 1,
	CODE_ALT_GR = CODE_ALT + 1,
	SHIFT = CODE_SHIFT,
	CTRL = SHIFT << 1,
	ALT = CTRL << 1,
	ALT_GR = ALT << 1,
	PRESSED = ALT_GR << 1,
	INVALID = 128,
	nShift = 0,
	nCtrl = 0,
	nAlt = 0,
	nAltGr = 0,
	nKeyCode,
	nCode,
	nOrd,
	sMods,
	sPCLookUp,

/*
	K  = PC keycode
	M  = 
	A  = Atom
	RC = 1 byte packed ROW, COL for the Atom Keyboard matrix
	G  =
	L  = Label to be used on graphical representation of the keys - ignore
	U  = Unicode value for HTML of the key - Ignore
	N  = Full name of the key in human readable form
*/

	aPCKeys =
	[
		//		K  M  A RC G L               U               N
		/* 00   0   */"00 00 c0 00 0",
		/* 01   1   */"10 01 41 81 2 &#x21E7;        &#x21E7;        Left Shift",
		/* 02   2   */"11 02 42 a1 2                 Ctrl            Left Ctrl",
		/* 03   3   */"12 03 43 a3 2                 Alt             Alt",
		/* 04   4   */"0f 04 44 a5 2                 Alt Gr          Alt Graphics",
		/* 05   5   */"00 01 45 8d 2 &#x21E7;        &#x21E7;        Right Shift",
		/* 06   6   */"00 02 46 a8 2                 Ctrl            Right Ctrl",
		/* 07   7   */"2e 07 47 4f e Delete          Delete          Delete",
		/* 08   8   */"08 08 08 2e e &larr;          &larr;          Back Space",
		/* 09   9   */"09 09 09 41 3 Tab &#x21E5;    Tab &#x21E4;    Tab",
		/* 0a  10   */"2d 0a 4a 2f e Insert          Insert          Insert",
		/* 0b  11   */"00 00 4b 00 1 Fn              Fn              Function",
		/* 0c  12   */"0c 0c 4c 00 5                                 Numeric 5",
		/* 0d  13   */"0d 0d 0d 4e 3 &#x21B5;        Enter           Enter",
		/* 0e  14   */"00 0d 4e 92 5 Enter           Enter           Numeric Enter",
		/* 0f  15   */"21 0f 4f 31 c Up              Page            Page Up",
		/* 10  16   */"2c 10 50 0e 1 Sys Rq          <u>Prt Scrn</u> System Request / Print Screen",
		/* 11  17   */"24 11 51 30 c Home            Home            Home",
		/* 12  18   */"23 12 52 50 c End             End             End",
		/* 13  19   */"13 13 53 0f 1 Break           <u>Pause</u>    Break",
		/* 14  20   */"14 14 54 61 2 Caps Lock       Caps Lock       Caps Lock",
		/* 15  21   */"91 15 55 0f 1 Lock            Scroll          Scroll Lock",
		/* 16  22   */"90 16 56 32 2 numlock.png     Num<br />Lock   Num Lock",
		/* 17  23   */"5c 17 57 a2 1                 winlogo.png     Left Windows",
		/* 18  24   */"5b 18 58 a6 1                 winlogo.png     Right Windows",
		/* 19  25   */"5d 19 59 a7 1                 prop.png        Properties",
		/* 1a  26   */"22 1a 5a 51 c Down            Page            Page Down",
		/* 1b  27   */"1b 1b 1b 01 3 Esc             Esc             Escape",
		/* 1c  28   */"25 1c 5c a8 c &larr;          &larr;          Cursor Left",
		/* 1d  29   */"26 1d 5d 8e c &uarr;          &uarr;          Cursor Up",
		/* 1e  30   */"27 1e b6 aa c &rarr;          &rarr;          Cursor Right",
		/* 1f  31   */"28 1f ad a9 c &darr;          &darr;          Cursor Down",
		/* 20  32   */"20 20 20 a4 b                                 Space",
		/* 21  33 ! */"00 00 b1 00 f",
		/* 22  34 " */"00 00 b2 00 f",
		/* 23  35 # */"de 23 23 6d b #               &tilde;         # / &tilde;",
		/* 24  36 $ */"00 00 b4 00 f",
		/* 25  37 % */"00 00 b5 00 f",
		/* 26  38 & */"00 00 b7 00 f",
		/* 27  39 ' */"00 00 27 00 f",
		/* 28  40 ( */"00 00 b9 00 f",
		/* 29  41 ) */"00 00 b0 00 f",
		/* 2a  42 * */"00 00 b8 00 f",
		/* 2b  43 + */"00 00 bd 00 f",
		/* 2c  44 , */"00 00 2c 00 f",
		/* 2d  45 - */"00 00 2d 00 f",
		/* 2e  46 . */"00 00 2e 00 f",
		/* 2f  47 / */"00 00 2f 00 f",
		/* 30  48 0 */"30 30 30 2b d 0               )               0 / )",
		/* 31  49 1 */"31 31 31 22 d 1               !               1 / !",
		/* 32  50 2 */"32 32 32 23 d 2               &quot;          2 / &quot;",
		/* 33  51 3 */"33 33 33 24 d 3               &pound;         3 / &pound;",
		/* 34  52 4 */"34 34 34 25 d 4               $               4 / $",
		/* 35  53 5 */"35 35 35 26 d 5               %               5 / %",
		/* 36  54 6 */"36 36 36 27 d 6               ^               6 / ^",
		/* 37  55 7 */"37 37 37 28 d 7               &amp;           7 / &amp;",
		/* 38  56 8 */"38 38 38 29 d 8               &lowast;        8 / *",
		/* 39  57 9 */"39 39 39 2a d 9               (               9 / (",
		/* 3a  58 : */"00 00 bb 00 f",
		/* 3b  59 ; */"ba 3b 3b 6b b ;               :               ; / :",
		/* 3c  60 < */"bc 3c ac 8a b ,               &lt;            , / &lt;",
		/* 3d  61 = */"bb 3d 3d 2d b =               +               = / +",
		/* 3e  62 > */"be 3e ae 8b b .               &gt;            . / &gt;",
		/* 3f  63 ? */"bf 3f af 8c b /               ?               / / ?",
		/* 40  64 @ */"c0 40 a7 6c b '               @               ' / @",
		/* 41  65 A */"41 41 c1 62 a                 A               Latin Letter a / A",
		/* 42  66 B */"42 42 c2 87 a                 B               Latin Letter b / B",
		/* 43  67 C */"43 43 c3 85 a                 C               Latin Letter c / C",
		/* 44  68 D */"44 44 c4 64 a                 D               Latin Letter d / D",
		/* 45  69 E */"45 45 c5 44 a                 E               Latin Letter e / E",
		/* 46  70 F */"46 46 c6 65 a                 F               Latin Letter f / F",
		/* 47  71 G */"47 47 c7 66 a                 G               Latin Letter g / G",
		/* 48  72 H */"48 48 c8 67 a                 H               Latin Letter h / H",
		/* 49  73 I */"49 49 c9 49 a                 I               Latin Letter i / I",
		/* 4a  74 J */"4a 4a ca 68 a                 J               Latin Letter j / J",
		/* 4b  75 K */"4b 4b cb 69 a                 K               Latin Letter k / K",
		/* 4c  76 L */"4c 4c cc 6a a                 L               Latin Letter l / L",
		/* 4d  77 M */"4d 4d cd 89 a                 M               Latin Letter m / M",
		/* 4e  78 N */"4e 4e ce 88 a                 N               Latin Letter n / N",
		/* 4f  79 O */"4f 4f cf 4a a                 O               Latin Letter o / O",
		/* 50  80 P */"50 50 d0 4b a                 P               Latin Letter p / P",
		/* 51  81 Q */"51 51 d1 42 a                 Q               Latin Letter q / Q",
		/* 52  82 R */"52 52 d2 45 a                 R               Latin Letter r / R",
		/* 53  83 S */"53 53 d3 63 a                 S               Latin Letter s / S",
		/* 54  84 T */"54 54 d4 46 a                 T               Latin Letter t / T",
		/* 55  85 U */"55 55 d5 48 a                 U               Latin Letter u / U",
		/* 56  86 V */"56 56 d6 86 a                 V               Latin Letter v / V",
		/* 57  87 W */"57 57 d7 43 a                 W               Latin Letter w / W",
		/* 58  88 X */"58 58 d8 84 a                 X               Latin Letter x / X",
		/* 59  89 Y */"59 59 d9 47 a                 Y               Latin Letter y / Y",
		/* 5a  90 Z */"5a 5a da 83 a                 Z               Latin Letter z / Z",
		/* 5b  91 [ */"db 5b 5b 4c b [               {               [ / {",
		/* 5c  92 \ */"dc 5c 5c 82 b &#x5c;          &brvbar;        &#x5c; / &brvbar;",
		/* 5d  93 ] */"dd 5d 5d 4d b ]               }               ] / }",
		/* 5e  94 ^ */"df 5e b6 21 b ` &#x7c;        &not;           ` &#x7c; / &not;",
		/* 5f  95 _ */"bd 5f ad 2c b -               _               - / _",
		/* 60  96 ` */"60 60 60 ab 5 Ins             0               Numeric 0",
		/* 61  97 a */"61 61 41 8f 5 End             1               Numeric 1",
		/* 62  98 b */"62 62 42 90 5 &darr;          2               Numeric 2",
		/* 63  99 c */"63 63 43 91 5 PgDn            3               Numeric 3",
		/* 64 100 d */"64 64 44 6e 5 &larr;          4               Numeric 4",
		/* 65 101 e */"65 65 45 6f 5                 5               Numeric 5",
		/* 66 102 f */"66 66 46 70 5 &rarr;          6               Numeric 6",
		/* 67 103 g */"67 67 47 52 5 Home            7               Numeric 7",
		/* 68 104 h */"68 68 48 53 5 &uarr;          8               Numeric 8",
		/* 69 105 i */"69 69 49 54 5 PgUp            9               Numeric 9",
		/* 6a 106 j */"6a 6a 4a 34 6 &lowast;        &lowast;        Numeric &lowast;",
		/* 6b 107 k */"6b 6b 4b 55 6 +               +               Numeric +",
		/* 6c 108 l */"00 00 4c 00 f",
		/* 6d 109 m */"6d 6d 4d 35 6 -               -               Numeric -",
		/* 6e 110 n */"6e 6e 4e ac 5 Del             .               Numeric .",
		/* 6f 111 o */"6f 6f 4f 33 6 /               /               Numeric /",
		/* 70 112 p */"70 70 50 02 4 F1              F1              F1",
		/* 71 113 q */"71 71 51 03 4 F2              F2              F2",
		/* 72 114 r */"72 72 52 04 4 F3              F3              F3",
		/* 73 115 s */"73 73 53 05 4 F4              F4              F4",
		/* 74 116 t */"74 74 54 06 4 F5              F5              F5",
		/* 75 117 u */"75 75 55 07 4 F6              F6              F6",
		/* 76 118 v */"76 76 56 08 4 F7              F7              F7",
		/* 77 119 w */"77 77 57 09 4 F8              F8              F8",
		/* 78 120 x */"78 78 58 0a 4 F9              F9              F9",
		/* 79 121 y */"79 79 59 0b 4 F10             F10             F10",
		/* 7a 122 z */"7a 7a 5a 0c 4 F11             F11             F11",
		/* 7b 123 { */"7b 7b db 0d 4 F12             F12             F12",
		/* 7c 124 | */"00 00 dc 00 f",
		/* 7d 125 } */"00 00 dd 00 f",
		/* 7e 126 ~ */"00 00 de 00 f",
		/* 7f 127   */"a3 b3 a3 00 b _               &pound;         _ / &pound;",
		/* 80 128   */"ff 00 ff 00 0"
	],

	sATOMLookUp,

	aATOMKeys =
	[
		//		K  M  A RC G L               U               N
		/* 00   0   */"00 00 c0 00 0 [Reserved]",
		/* 01   1   */"01 01 41 62 2 SHIFT           SHIFT           Left Shift",
		/* 02   2   */"02 02 42 42 2 CTRL            CTRL            Ctrl",
		/* 03   3   */"03 09 43 6e 2 REPT            REPT            Repeat",				// We could swap this and the next entry since Alt Gr is more
		/* 04   4   */"04 09 44 00 2 [Atom REPEAT]                   [PC Alt Graphics]",	// reliable than Alt in IE but would this mean ATOM / BBC think
		/* 05   5   */"00 01 45 6d 2 SHIFT           SHIFT           Right Shift",			// that the Ctrl key is being pressed? Send Ctrl Up to ATOM/BEEB?
		/* 06   6   */"00 00 46 00 f [Free]                          [PC Right Ctrl]",
		/* 07   7   */"07 45 47 00 e [Atom DELETE]                   [PC Delete]",
		/* 08   8   */"08 45 08 2f e DELETE          DELETE          Delete",
		/* 09   9   */"09 46 09 22 e COPY            COPY            Copy",
		/* 0a  10   */"0a 46 4a 00 e [Atom COPY]                     [PC Insert]",
		/* 0b  11   */"00 00 4b 00 f [Free]                          [PC Function]",
		/* 0c  12   */"0c bb 4c 00 e [Atom COPY]                     [PC Numeric 5]",
		/* 0d  13   */"0d 47 0d 4f 3 RETURN          RETURN          Return",
		/* 0e  14   */"00 47 4e 00 3 [Atom RETURN]                   [PC Numeric Enter]",
		/* 0f  15   */"1d 53 4f 41 c &#x2195;        &#x2195;        Cursor Up / Down",
		/* 10  16   */"1e 54 50 21 c &harr;          &harr;          Cursor Right / Left",
		/* 11  17   */"00 00 51 00 f [Free]                          [PC Home]",
		/* 12  18   */"12 46 52 00 e [Atom COPY]                     [PC End]",
		/* 13  19   */"13 0a 53 0f 1 BREAK           BREAK           Break",
		/* 14  20   */"14 55 54 61 2 LOCK            LOCK            Lock",
		/* 15  21   */"00 00 55 00 f [Free]                          [PC Scroll Lock]",
		/* 16  22   */"00 00 56 00 f [Free]                          [PC Num Lock]",
		/* 17  23   */"00 00 57 00 f [Free]                          [PC Left Windows]",
		/* 18  24   */"00 00 58 00 f [Free]                          [PC Right Windows]",
		/* 19  25   */"00 00 59 00 f [Free]                          [PC Properties]",
		/* 1a  26   */"00 00 5a 00 f [Free]                          [PC Page Down]",
		/* 1b  27   */"1b 71 1b 01 3 ESC             ESC             Escape",
		/* 1c  28   */"1c ad 5c 00 c                                 [PC Cursor Left]",
		/* 1d  29   */"9e 54 5d 00 c                                 [PC Shift+Cursor Right]",
		/* 1e  30   */"9d 53 b6 00 c                                 [PC Shift+Cursor Up]",
		/* 1f  31   */"1f ae ad 00 c                                 [PC Cursor Down]",
		/* 20  32   */"20 5a 20 81 b                                 Space",
		/* 21  33 ! */"00 00 b1 00 f [Free]                          [PC Shift+1]",
		/* 22  34 " */"00 00 b2 00 f [Free]                          [PC Shift+2]",
		/* 23  35 # */"23 c0 b3 00 b 3               #               3 / #",
		/* 24  36 $ */"00 00 b4 00 f [Free]                          [PC Shift+4]",
		/* 25  37 % */"00 00 b5 00 f [Free]                          [PC Shift+5]",
		/* 26  38 & */"b7 c9 b7 00 b [Atom 6 / &]                    [PC Shift+6]",
		/* 27  39 ' */"40 ca 27 00 b 7               '               7 / '",
		/* 28  40 ( */"b0 cc b9 00 b [Atom 8 / (]                    [PC Shift+8]",
		/* 29  41 ) */"b9 cb b0 00 b [Atom 9 / )]                    [PC Shift+9]",
		/* 2a  42 * */"b8 cd b8 00 b :               &lowast;        : / &lowast;",
		/* 2b  43 + */"bd ce bd 00 b =               +               = / +",
		/* 2c  44 , */"3c 32 2c 6a b ,               &lt;            , / &lt;",
		/* 2d  45 - */"5f 31 2d 0c b -               =               - / =",
		/* 2e  46 . */"3e 2a 2e 6b b .               &gt;            . / &gt;",
		/* 2f  47 / */"3f 29 2f 6c b /               ?               / / ?",
		/* 30  48 0 */"30 44 31 0b d 0               0               0",
		/* 31  49 1 */"31 43 31 02 d 1               !               1 / !",
		/* 32  50 2 */"32 42 32 03 d 2               &quot;          2 / &quot;",
		/* 33  51 3 */"33 41 33 04 d 3               #               3 / #",
		/* 34  52 4 */"34 3a 34 05 d 4               $               4 / $",
		/* 35  53 5 */"35 39 35 06 d 5               %               5 / %",
		/* 36  54 6 */"36 38 36 07 d 6               &amp;           6 / &amp;",
		/* 37  55 7 */"37 37 37 08 d 7               '               7 / '",
		/* 38  56 8 */"38 36 38 09 d 8               (               8 / (",
		/* 39  57 9 */"39 35 39 0a d 9               )               9 / )",
		/* 3a  58 : */"bb cd bb 0d b :               &lowast         : / &lowast;",
		/* 3b  59 ; */"3b 33 3b 4c b ;               +               ; / +",
		/* 3c  60 < */"00 00 ac 00 f [Free]                          [PC Shift+,]",
		/* 3d  61 = */"3d d0 3d 00 b -               =               - / =",
		/* 3e  62 > */"00 00 ae 00 f [Free]                          [PC Shift+.]",
		/* 3f  63 ? */"5e d9 af 00 b @               @               @ / `",
		/* 40  64 @ */"c0 d9 a7 2d b @               @               @ / `",
		/* 41  65 A */"41 27 41 43 a A               A               Latin Letter A / a",
		/* 42  66 B */"42 26 42 67 a B               B               Latin Letter B / b",
		/* 43  67 C */"43 25 43 65 a C               C               Latin Letter C / c",
		/* 44  68 D */"44 24 44 45 a D               D               Latin Letter D / d",
		/* 45  69 E */"45 23 45 25 a E               E               Latin Letter E / e",
		/* 46  70 F */"46 22 46 46 a F               F               Latin Letter F / f",
		/* 47  71 G */"47 21 47 47 a G               G               Latin Letter G / g",
		/* 48  72 H */"48 1a 48 48 a H               H               Latin Letter H / h",
		/* 49  73 I */"49 19 49 2a a I               I               Latin Letter I / i",
		/* 4a  74 J */"4a 18 4a 49 a J               J               Latin Letter J / j",
		/* 4b  75 K */"4b 17 4b 4a a K               K               Latin Letter K / k",
		/* 4c  76 L */"4c 16 4c 4b a L               L               Latin Letter L / l",
		/* 4d  77 M */"4d 15 4d 69 a M               M               Latin Letter M / m",
		/* 4e  78 N */"4e 14 4e 68 a N               N               Latin Letter N / n",
		/* 4f  79 O */"4f 13 4f 2b a O               O               Latin Letter O / o",
		/* 50  80 P */"50 12 50 2c a P               P               Latin Letter P / p",
		/* 51  81 Q */"51 11 51 23 a Q               Q               Latin Letter Q / q",
		/* 52  82 R */"52 7a 52 26 a R               R               Latin Letter R / r",
		/* 53  83 S */"53 79 53 44 a S               S               Latin Letter S / s",
		/* 54  84 T */"54 78 54 27 a T               T               Latin Letter T / t",
		/* 55  85 U */"55 77 55 29 a U               U               Latin Letter U / u",
		/* 56  86 V */"56 76 56 66 a V               V               Latin Letter V / v",
		/* 57  87 W */"57 75 57 24 a W               W               Latin Letter W / w",
		/* 58  88 X */"58 74 58 64 a X               X               Latin Letter X / x",
		/* 59  89 Y */"59 73 59 28 a Y               Y               Latin Letter Y / y",
		/* 5a  90 Z */"5a 72 5a 63 a Z               Z               Latin Letter Z / z",
		/* 5b  91 [ */"5b 59 5b 4d b [               [               [ / {",
		/* 5c  92 \ */"5c 58 5c 2e b &#x5c;          &#x5c;          &#x5c; / &#x7c;",
		/* 5d  93 ] */"5d 57 5d 4e b ]               ]               ] / }",
		/* 5e  94 ^ */"b6 ab b6 0e b &uarr;          &uarr;          &uarr; / &tilde;",
		/* 5f  95 _ */"bd 00 ad 00 b -               _               - / _",
		/* 60  96 ` */"60 44 60 00 5 Ins             0               Numeric 0",
		/* 61  97 a */"61 43 c1 00 5 End             1               Numeric 1",
		/* 62  98 b */"62 42 c2 00 5 &darr;          2               Numeric 2",
		/* 63  99 c */"63 41 c3 00 5 PgDn            3               Numeric 3",
		/* 64 100 d */"64 3a c4 00 5 &larr;          4               Numeric 4",
		/* 65 101 e */"65 39 c5 00 5                 5               Numeric 5",
		/* 66 102 f */"66 38 c6 00 5 &rarr;          6               Numeric 6",
		/* 67 103 g */"67 37 c7 00 5 Home            7               Numeric 7",
		/* 68 104 h */"68 36 c8 00 5 &uarr;          8               Numeric 8",
		/* 69 105 i */"69 35 c9 00 5 PgUp            9               Numeric 9",
		/* 6a 106 j */"6a cd ca 00 6 *               *               Numeric *",
		/* 6b 107 k */"6b ce cb 00 6 +               +               Numeric +",
		/* 6c 108 l */"00 00 cc 00 f [Free]                          [PC Shift+L]",
		/* 6d 109 m */"6d 31 cd 00 6 -               -               Numeric -",
		/* 6e 110 n */"6e 2a ce 00 5 Del             .               Numeric .",
		/* 6f 111 o */"6f 29 cf 00 6 /               /               Numeric /",
		/* 70 112 p */"70 00 d0 00 4 F1              F1              Atomic Theory and Practice	(Manual) tab",
		/* 71 113 q */"71 00 d1 00 4 F2              F2              Atomic Theory and Practice	(Manual) tab",
		/* 72 114 r */"72 00 d2 00 4 F3              F3              Virtual CPU - Chip layout / Schematic layout tabs",
		/* 73 115 s */"73 00 d3 00 4 F4              F4              Swap keyboard layout (Normal / Alternate)",
		/* 74 116 t */"74 00 d4 00 4 F5              F5              CPU Speed (Normal / Fastest)",
		/* 75 117 u */"75 00 d5 00 4 F6              F6              ROM selection list / tab",
		/* 76 118 v */"76 00 d6 00 4 F7              F7              Disk menu / tab",
		/* 77 119 w */"77 00 d7 00 4 F8              F8              Tape menu / tab",
		/* 78 120 x */"78 00 d8 00 4 F9              F9              Options tab",
		/* 79 121 y */"79 00 d9 00 4 F10             F10             Monitor - ATOM Mode; Full dissasembler; Assembler tabs",
		/* 7a 122 z */"7a 00 da 00 4 F11             F11             Toggle fullscreen mode",
		/* 7b 123 { */"7b 0a db 00 4 F12             F12             ATOM 'BREAK' key",
		/* 7c 124 | */"00 00 dc 00 f [Free]                          [PC Shift+\]",
		/* 7d 125 } */"00 00 dd 00 f [Free]                          [PC Shift+]]",
		/* 7e 126 ~ */"00 00 de 00 f [Free]                          [PC Shift+]",
		/* 7f 127   */"00 00 a3 00 f [Free]          [Code B3]       [PC Shift+4]",			// BBC Key Category b (Punct) _ / &pound;
		/* 80 128   */"ff 00 ff 00 0"
	],

	aKeys = [B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B],

	szBuffer="";

function fKeyboard()
{
	bInput = true;
}

function fRedirect()
{
	fAddEvent(document, "keydown",  function(e){return fKeyEvent(e||window.event,1)}, 0);
	fAddEvent(document, "keyup",    function(e){return fKeyEvent(e||window.event,2)}, 0);
	fAddEvent(document, "keypress", function(e){return fKeyEvent(e||window.event,3)}, 0);
}

function fKeyLabel(nCode, aKeyData)
{
	return (nCode = (aKeyData || aPCKeys) [nCode & 0x7f]).L ? nCode.L : nCode.U;
}

function fKeyName(nCode, aKeyData)
{
	return (aKeyData || aPCKeys) [nCode & 0x7f].N;
}

// This needs an overhaul / rationalising! :-/

function fAdd(s, a)
{
	return a ? (s ? s + '+' + a : a) : s;
}

function fKeyMods()
{
	sMods = fAdd("",    nShift ?  fKeyLabel(CODE_SHIFT)  : "");
	sMods = fAdd(sMods, nCtrl  ?  fKeyLabel(CODE_CTRL)   : "");
	sMods = fAdd(sMods, nAlt   ?  fKeyLabel(CODE_ALT)    : "");
	sMods = fAdd(sMods, nAltGr ?  fKeyLabel(CODE_ALT_GR) : "");
}

function fKeyMap(nCode)
{
	var nOrd = fKeyOrd(nCode, sATOMLookUp); return nOrd - INVALID ? nOrd : fKeyOrd(nCode & 0x7f, sATOMLookUp);
}

function fKeyStatus(nCode)
{
	var nKey = nCode & 0xff, nOrd = fKeyMap(nKey), sStatus;
	sStatus = (nKey >= CODE_SHIFT && nKey <= CODE_ALT_GR ? sMods : fAdd(sMods, fKeyName(nKey))) + ' ' + (nCode & 0x800 ? "down" : "up") + " Key Code: " + HEX(nKey);
	nCode = nOrd - INVALID ? (nCode & 0x80 ? 256-aATOMKeys [nOrd].M : aATOMKeys [nOrd].M-1) : 0;
	sStatus += " ATOM Key Code: " + HEX(nCode) + ' ' + (nCode & 0x80 ? fKeyLabel(CODE_SHIFT) : "") + fKeyName(nOrd, aATOMKeys);
	return sStatus;
}

function fKeyOrd(nOrd, sLookUp)
{
	nOrd = sLookUp.indexOf(String.fromCharCode(nOrd));
//	if(nOrd==112)fHexDump();
	return nOrd >= 0 && nOrd < 128 ? nOrd : INVALID;
}

function fKeyGet(e, bDown)
{
	nOrd = fKeyOrd(nKeyCode = e.keyCode, sPCLookUp);
	nCode = nOrd - INVALID ? aPCKeys [nOrd].M : nOrd;
//	if (bDown && nKeyCode == 116) history.go(0); return; // If we arent using F5. Come back to events we don't want cancelled and menu keys later
	if (nCode == CODE_ALT) {
		if (bDown) {
			if (nCtrl)	{ nCode = CODE_ALT_GR; nCtrl = 0; nAlt = 0; } }
		else
			if (nAltGr)	{ nCode = CODE_ALT_GR; nCtrl = 0; nAlt = 0; } }
//	if (nCode == CODE_ALT) nCode = 0; // This may be needed as it jumps out of browser leaving alt stuck down
	if (!bDown) fKeyMods();
	switch (nCode) {
		case CODE_SHIFT:	nShift = bDown ? SHIFT  : 0; break;
		case CODE_CTRL:		nCtrl  = bDown ? CTRL   : 0; break;
		case CODE_ALT:		nAlt   = bDown ? ALT    : 0; break;
		case CODE_ALT_GR:	nAltGr = bDown ? ALT_GR : 0; }
	if (bDown) fKeyMods();
	return nCode >= INVALID ? 0 : ((bDown ? PRESSED : 0) | nShift | nCtrl | nAlt | nAltGr) << 7 | nCode;
}

function fKeyEvent(e, nStatus)
{
	if (bInput) return;
	fKey(e, nStatus);
	return fEndEvent(e, 3);
}

function fAddEvent(oObj, sEvent, fHandler, bCapture)
{
	onEvent(oObj || document, sEvent, fHandler, bCapture);
}

function fEndEvent(e,n)
{
	n=(n||0)&3;
	if (n & 1)
		fStopBubble(e);
	if (n & 2)
		fStopDefault(e);
	return n ? false : true;
}

function fStopBubble(e)
{
	if (e.stopPropagation) e.stopPropagation(); else e.cancelBubble = true;
}

function fStopDefault(e)
{
	if (e.preventDefault) e.preventDefault(); else e.returnValue = false;
}

function fDisplay()
{
	if (bCanvas=fInitCanvas()?1:0) return;
	var
		x,
		y,
		oCell=document.createElement("b");
	oCell.className="cBlock cChar"+(bGreen?"Grn":"");
	oScr=$("dTxtScreen");
	for(y=0;y<ROWS;++y)
		for(x=0;x<COLS;++x) {
			oCell.id=fCellId(y,x);
			oScr.appendChild(oCell.cloneNode(false)); }
}

function fTxtScreen()
{
	var x,y,s;
	if(bCanvas) return;
	for(y=0;y<ROWS;++y)
		for(x=0;x<COLS;++x) {
			s=fCell(y,x).style;
			s.width=FW+"px";
			s.height=FH+"px";
			s.top=(y*FH)+"px";
			s.left=(x*FW)+"px";
			s.backgroundPosition=fChrPos(LDB(HIMEM+(y<<5)+x)); }
}

function fChr(r,c,v)
{
	fCell(r,c).style.backgroundPosition=fChrPos(v);
}

function fCell(r,c)
{
	return $(fCellId(r,c));
}

function fCellId(r,c)
{
	return 'r'+r+'c'+c;
}

function fChrPos(c)
{
	return '-'+((c&31)*FW)+"px -"+((c>>5)*FH)+"px";
}

function reg(k,i,s,p,l,L)
{
	if(typeof(k)=="object" && k.length>127 && typeof(k[0])=="string")
		for(i=0,l=L="";i<k.length;++i) {
			k[i]={K:hex(s=k[i],p=0),M:hex(s,p+=3),A:hex(s,p+=3),RC:hex(s,p+=3),G:hex(s,p+=3,1),L:mid(s,p+=2,16),U:mid(s,p+=16,16),N:mid(s,p+=16)}
			l+=String.fromCharCode(k[i].K);L+=String.fromCharCode(k[i].A); }
	return l;
}//+L;}

function fATOMPress(nKey)
{
	if (nKey) szBuffer += String.fromCharCode(nKey >> 8) + String.fromCharCode(nKey & 0xFF);
	if (!szBuffer) return;
	nKey = szBuffer.charCodeAt(0) << 8 | szBuffer.charCodeAt(1);
	szBuffer = szBuffer.substring(2);

	var
		N,
		B=1,
		R=0,
		C=fKeyMap(nKey&0xff),
		S=nKey&0x80?1:0,
		D=nKey&0x800?1:0;

	// R = Row, C = InKey Minus Code / Column
	if(C==INVALID)return;
	C=N=aATOMKeys[C].M-1;N=S?~N:N;
	if(C&0x80){S=1;C=255-C;}
	C=(R=C&15,C>>=4)?5-C%7:R-2?R^7:8
	if(R==9&&C==14)return fBreak();
	if(S)D?(aKeys[0]&=0x7f):(aKeys[0]|=0x80);
	if(R==1&&C==6)D?(aKeys[0]&=0xbf):(aKeys[0]|=0x40);
	B<<=C;if(D)aKeys[R]&=255-B;else aKeys[R]|=B;
}

//function fSetKey(R,V){}

function fKey(e, nStatus)
{
	if (bKBEn && nStatus < 3) fATOMPress(fKeyGet(e, nStatus==1));
}
