/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
;
;	fInitAddr()
;
;	Initialize memorymap depending on var bBBC:
;
;						BBC mode			Atom mode
;	-------------------------------------------------------
;		RAM			0x0000 - 0x3FFF		0x0000 - 0x7FFF
;		VIDEO		0x4000 - 0x57FF		0x8000 - 0x97FF
;		Unused		0x6000 - 0x6FFF		0x9800 - 0xAFFF
;		PPIA		0x7000 - 0x7FFF		0xB000 - 0xBFFF
;		ROM			0x8000 - 0xFFFF		0xC000 - 0xFFFF
;	-------------------------------------------------------
;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

function fInitAddr()
{
	if (bBBC) {
		HIMEM		= 0x4000;
		PPIA_ADDR	= 0x7000;
		ROM			= 0x8000;
		LDB			= LDBB;
		STB			= STBB; }
	else {
		HIMEM		= 0x8000;
		PPIA_ADDR	= 0xB000;
		ROM			= 0xC000;
		LDB			= LDBA;
		STB			= STBA; }
}

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
;
;	PIA 8255 functions
;
;	Port A - #B000
;
;		Output bits:		Function:
;			0 - 3		Keyboard row
;			4 - 7		Graphics mode
;
;	Port B - #B001
;
;		Input bits:			Function:
;			0 - 5		Keyboard column
;			6			CTRL key (low when pressed)
;			7			SHIFT keys {low when pressed)
;
; Port C - #B002
;
;		Output bits:		Function:
;			0			Tape output
;			1			Enable 2.4 kHz to cassette output
;			2			Loudspeaker
;			3			Not used
;
;		Input bits:			Function:
;			4			2.4 kHz input
;			5			Cassette input
;			6			REPT key (low when pressed)
;			7			60 Hz sync signal (low during flyback)
;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

function fPIAR(a,v)
{
	return a-1?aPPIA[a]:aKeys[aPPIA[0]&15];
}

function fPIAW(a,v)
{
	if(a<3)aPPIA[a]=a-2?v:(aPPIA[a]&243)|(v&12);
	a?a-2?
	0:
	fMode(nMode,v&8?1:0):
	fMode(v>>4,nPal);
}

function fIOPoll(c)
{
	nTapeClk+=c;
	if (nTapeClk>nTapeHz) {
		nTapeClk=0;
		aPPIA[2]^=0x10; }
	fVIAPoll(c);
}

function fIOR(a,A)
{
	return(A=(a>>10)&3)?A-1?A-2?fBCxxRead(a):fVIARead(a):fMMCRead(a):fPIAR(a&3)
}

function fIOW(a,v)
{
	(A=(a>>10)&3)?A-1?A-2?fBCxxWrite(a,v):fVIAWrite(a,v):fMMCWrite(a,v):fPIAW(a&15,v)
}

function fSpeaker(bOn){/* Sound not yet implemented */}

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
; Atom mode memory declaration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

function STBA(a,v,A)
{
	a<2048?(MEM[a]=v):										// 0x0000-0x1FFF
	(A=a>>12)<10?A<2?MEM[a]=v:								// 0x2000-0x9FFF
	(MEM[a]=v,(a-=HIMEM)>=0&&a<nLen?fP(a,v):0):				// ???
	A-11?0:fIOW(a,v&0xff);									// 0xB000-0xBFFF
}

function LDBA(a,A)
{
	if((A=a>>12)<10)return MEM[a];							// 0x0000-0x9FFF
	switch(A) {
		case 10:return aUtilRoms[ROMnr].charCodeAt(a-40960)	// 0xA000-0xAFFF
		case 11:return fIOR(a)&0xff;						// 0xB000-0xBFFF
		case 12:return sFxxxPatch_ROM.charCodeAt(a-49152);	// 0xC000-0xCFFF
		case 13:return sAFloat_IC21.charCodeAt(a-53248);	// 0xD000-0xDFFF

//		case 14:return sDOSROM_U15.charCodeAt(a-57344);		// 0xE000-0xEFFF
//		case 14:return sMMC297E_ROM.charCodeAt(a-57344);	// 0xE000-0xEFFF
		case 14:return sSDROMe_ROM.charCodeAt(a-57344);		// 0xE000-0xEFFF

		case 15:return sFxxxPatch_ROM.charCodeAt(a-57344);}	// 0xF000-0xFFFF
}

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
; BBC mode memory declaration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

function STBB(a,v)
{
	return(s=a>>12)<6?(MEM[a]=v,							// 0x0000-0x5FFF
		(a-=HIMEM)>=0&&a<nLen?fP(a,v):0):					// ???
		s>6&&s<8?fIOW(a,v&0xff):0;							// 0x6000-0x7FFF
}

function LDBB(a)
{
	return(s=a>>12)<6?MEM[a]:								// 0x0000-0x5FFF
	s<7?0:													// 0x6000-0x6FFF
	s<8?fIOR(a)&255:										// 0x7000-0x7FFF
	s<12?sBASIC1_ROM.charCodeAt(a-32768):					// 0x8000-0xBFFF
	s<15?0:													// 0xC000-0xEFFF
	sATOM_BBC_BASIC_OS_ROM.charCodeAt(a-61440);				// 0xF000-0xFFFF
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function clearMemory()
{
	MEM = cBuffer(0x10000);
	for(i=0;i<0xA000;MEM[i++]=0);
	for(i=8;i<13;MEM[i++]=Math.floor(256*Math.random()));
	for(i=0x100;i<0x200;MEM[i++]=0);
}

