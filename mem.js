/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
;
; fInitAddr()
;
; Initialize memorymap depending on var bBBC:
;
;            BBC mode           Atom mode
; -------------------------------------------------------
; RAM     0x0000 - 0x5FFF    0x0000 - 0x7FFF
; EXT1    0x6000 - 0x6FFF
; EXT2    0x7000 - 0x7FFF
; VIDEO   0x8000 - 0x97FF    0x8000 - 0x97FF
; Unused  0x9800 - 0x9FFF    0x9800 - 0x9FFF
; UTIL                       0xA000 - 0xAFFF
; IO      0xB000 - 0xBFFF    0xB000 - 0xBFFF
; BASIC   0xC000 - 0xEFFF    0xC000 - 0xCFFF
; FP                         0xD000 - 0xDFFF
; DOS                        0xE000 - 0xEFFF
; MOS     0xF000 - 0xFFFF    0xF000 - 0xFFFF
; -------------------------------------------------------
;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

function fInitAddr()
{
         if (bBBC) {
                  HIMEM       = 0x6000;
                  PPIA_ADDR   = 0xB000;
                  ROM         = 0xA000;
                  LDB         = LDBB;
                  STB         = STBB; }
         else {
                  HIMEM       = 0x8000;
                  PPIA_ADDR   = 0xB000;
                  ROM         = 0xC000;
                  LDB         = LDBA;
                  STB         = STBA; }
}

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
;
; PIA 8255 functions
;
; Port A - #B000
;          Output bits:   Function:
;             0 - 3        Keyboard row
;             4 - 7        Graphics mode
;
; Port B - #B001
;          Input bits:    Function:
;             0 - 5        Keyboard column
;               6          CTRL key (low when pressed)
;               7          SHIFT keys {low when pressed)
;
; Port C - #B002
;          Output bits:   Function:
;               0          Tape output
;               1          Enable 2.4 kHz to cassette output
;               2          Loudspeaker
;               3          Not used
;
;          Input bits:    Function:
;               4          2.4 kHz input
;               5          Cassette input
;               6          REPT key (low when pressed)
;               7          60 Hz sync signal (low during flyback)
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
         if (a>=0xB000 && a<=0xB003){return fPIAR(a&3)}                          // PIA
         if (a>=0xB010 && a<=0xB20E){return sBRAN_B010[a-0xB010].charCodeAt(0)}  // BRAN1
         if (a>=0xB400 && a<=0xB403){return fMMCRead(a)}                         // ATOMMC
         if (a>=0xB410 && a<=0xB6ac){return sBRAN_B410[a-0xB410].charCodeAt(0)}  // BRAN2
         if (a>=0xB800 && a<=0xB80F){return fVIARead(a)}                         // VIA
         if (a>=0xBDE8 && a<=0xBDEA){return fBCxxRead(a)}                        // Mouse
         if (a>=0xBffe){return fBCxxRead(a)}                                     // BFFE
         if (a>=0xBfff){return fBCxxRead(a)}                                     // BFFF
        return 0xbf
}

function fIOW(a,v)
{
         if (a>=0xB000 && a<=0xB003){return fPIAW(a&15,v)}                          // PIA
         if (a>=0xB400 && a<=0xB403){return fMMCWrite(a,v)}                         // ATOMMC
         if (a>=0xB800 && a<=0xB80F){return fVIAWrite(a,v)}                         // VIA
         if (a>=0xBDE8 && a<=0xBDEA){return fBCxxWrite(a,v)}                        // Mouse
         if (a>=0xBffe){return fBCxxWrite(a,v)}                                     // BFFE
         if (a>=0xBfff){return fBCxxWrite(a,v)}                                     // BFFF
}

function fSpeaker(bOn){/* Sound not yet implemented */}

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
; Atom mode memory declaration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

function STBA(a,v)
{
	var A=a>>12;
	if (A<8) return MEM[a]=v;					     // 0x0000-0x7FFF
	switch(A){
		case 8:case 9:	return fP(a-HIMEM,MEM[a]=v);				// 0x8xxx-0x9FFF
		case 10:	return aBFFE & 0x01 ? MEM[a-0x3000]=v : 0;   // 0xaxxx
		case 11:	return fIOW(a,v&0xff)			     // 0xBxxx
	}
}

function LDBA(a,A)
{
         if((A=a>>12)<10)return MEM[a];                                      // 0x0000-0x9FFF
         switch(A) {
                  case 10: if (aBFFE & 0x01){                                // 0xAxxx
                             return MEM[a-0x3000];
                           } else {
                             return aUtilRoms[aBFFF&7].charCodeAt(a-0xa000);
                           }
                  case 11: return fIOR(a)&0xff;                              // 0xBxxx
                  case 12: if (bAtoMMC_enable){                              // 0xCxxx
                             return sFxxxPatch_ROM.charCodeAt(a-0xc000);
                           } else {
                             return sABASIC_IC20.charCodeAt(a-0xc000);
                           }
                  case 13: if (bAtoMMC_enable){                              // 0xDxxx
                             return sDxxxPatch_ROM.charCodeAt(a-0xd000);
                           } else {
                             return sAFloat_IC21.charCodeAt(a-0xd000);
                           }
                  case 14: if (bAtoMMC_enable){                              // 0xExxx
                             if (nFileSystem == 0){
                               return sDOSROM_U15.charCodeAt(a-0xe000);}
                             if (nFileSystem == 1){
                               return sMMC297E_ROM.charCodeAt(a-0xe000);}
                             if (nFileSystem == 2){
                             return sSDROMe_ROM.charCodeAt(a-0xe000);}
                           } else {
                             return a>>8;
                           }
                  case 15: if (bAtoMMC_enable){                              // 0xFxxx
                             return sFxxxPatch_ROM.charCodeAt(a-0xe000);
                           } else {
                             return sABASIC_IC20.charCodeAt(a-0xe000);
                           }
         }
}

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
; BBC mode memory declaration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

function STBB(a,v)
{
	var A=a>>12;
	if (A<6) return MEM[a]=v;					      // 0x0000-0x5FFF
	switch(A){
		case  6:        return aBFFE & 0x01 ? MEM[a]=v : 0;           // 0x6xxx
                case  7:        return aBFFE & 0x02 ? MEM[a]=v : 0;           // 0x7xxx
                case  8:case 9:	return fP(a-0x8000,MEM[a]=v);                 // 0x8xxx-0x9FFF
		case 11:	return fIOW(a,v&0xff)			      // 0xBxxx
	}
}

function LDBB(a)
{
         if((A=a>>12)<6)return MEM[a];                                        // 0x0000-0x5FFF
         switch(A) {
                  case 6: if (aBFFE & 0x01){                                  // 0x6xxx
                             return MEM[a];
                           } else {
                             return sBBCEXT1_ROM.charCodeAt(a-0x6000);
                           }
                  case 7: if (aBFFE & 0x02){                                  // 0x7xxx
                             return MEM[a];
                           } else {
                             return sBBCEXT2_ROM.charCodeAt(a-0x7000);
                           }
                  case 8:case 9: return MEM[a];                               // 0x8xxx-0x9FFF
                  case 10: return sBASIC1_ROM.charCodeAt(a-0xa000);           // 0xAxxx
                  case 11: return fIOR(a)&0xff;                               // 0xBxxx
                  case 12: return sBASIC1_ROM.charCodeAt(a-0xb000);           // 0xCxxx
                  case 13: return sBASIC1_ROM.charCodeAt(a-0xb000);           // 0xDxxx
                  case 14: return sBASIC1_ROM.charCodeAt(a-0xb000);           // 0xExxx
                  case 15: return sATOM_BBC_BASIC_OS_ROM.charCodeAt(a-0xf000);// 0xFxxx                             // 0xFxxx
         }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function clearMemory()
{
         MEM = cBuffer(0x10000);
         for(i=0;i<0xA000;MEM[i++]=0);
         for(i=8;i<13;MEM[i++]=Math.floor(256*Math.random()));
         for(i=0x100;i<0x200;MEM[i++]=0);
}

