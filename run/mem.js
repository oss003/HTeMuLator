
/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
;
;   fInitAddr()
;
;   Initialize memory map depending on var bBBC:
;
;                   BBC mode            Atom mode
;   ---------------------------------------------------
;       RAM     0x0000 - 0x5FFF     0x0000 - 0x7FFF
;       EXT1    0x6000 - 0x6FFF
;       EXT2    0x7000 - 0x7FFF
;       VIDEO   0x8000 - 0x97FF     0x8000 - 0x97FF
;       Unused  0x9800 - 0x9FFF     0x9800 - 0x9FFF
;       UTIL                        0xA000 - 0xAFFF
;       IO      0xB000 - 0xBFFF     0xB000 - 0xBFFF
;       BASIC   0xC000 - 0xEFFF     0xC000 - 0xCFFF
;       FP                          0xD000 - 0xDFFF
;       DOS                         0xE000 - 0xEFFF
;       MOS     0xF000 - 0xFFFF     0xF000 - 0xFFFF
;   ---------------------------------------------------
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

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
;
;   PIA 8255 functions
;
;   Port A - #B000
;       Output bits:        Function:
;           0 - 3           Keyboard row
;           4 - 7           Graphics mode
;
;   Port B - #B001
;       Input bits:         Function:
;           0 - 5           Keyboard column
;             6             CTRL  key  (low when pressed)
;             7             SHIFT keys (low when pressed)
;
;   Port C - #B002
;       Output bits:        Function:
;             0             Tape output
;             1             Enable 2.4 kHz to cassette output
;             2             Loudspeaker
;             3             Not used
;
;       Input bits:         Function:
;             4             2.4 kHz input
;             5             Cassette input
;             6             REPT key (low when pressed)
;             7             60 Hz sync signal (low during flyback)
;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

function fPIAR(a)
{
    return a == 1 ? (aKeys [aPPIA [0] & 0x0F] & 0x3F) | (aKeys [0] & 0xC0) : aPPIA [a];
}

function fPIAW(a, v)
{
    if (a < 3) aPPIA [a] = a == 2 ? (aPPIA [a] & 0xF3) | (v & 0x0C) : v;
    if (!a) fMode(v >> 4, nPal); else if (a == 2) fMode(nMode, v & 0x08 ? 1 : 0);
}

function fIOPoll(c)
{
    nTapeClk += c;
    if (nTapeClk > nTapeHz) {
        nTapeClk = 0;
        aPPIA [2] ^= 0x10; }
    fVIAPoll(c);
}

function fIOR(a)
{
    if (a >= 0xB000 && a <= 0xB003) return fPIAR(a & 0x03);                         // PIA
    if (a >= 0xB010 && a <= 0xB20E) return sBRAN_B010 [a - 0xB010].charCodeAt(0);   // BRAN1
    if (a >= 0xB400 && a <= 0xB403) return fMMCRead(a);                             // ATOMMC
    if (a >= 0xB410 && a <= 0xB6AC) return sBRAN_B410 [a - 0xB410].charCodeAt(0);   // BRAN2
    if (a >= 0xB800 && a <= 0xB80F) return fVIARead(a);                             // VIA
    if (a >= 0xBDE8 && a <= 0xBDEA) return fBCxxRead(a);                            // Mouse
    if (a >= 0xBFFE)                return fBCxxRead(a);                            // BFFE
    if (a >= 0xBFFF)                return fBCxxRead(a);                            // BFFF
    return 0xBF;
}

function fIOW(a, v)
{
    if (a >= 0xB000 && a <= 0xB003) return fPIAW(a & 0x0F, v);                      // PIA
    if (a >= 0xB400 && a <= 0xB403) return fMMCWrite(a, v);                         // ATOMMC
    if (a >= 0xB800 && a <= 0xB80F) return fVIAWrite(a, v);                         // VIA
    if (a >= 0xBDE8 && a <= 0xBDEA) return fBCxxWrite(a, v);                        // Mouse
    if (a >= 0xBFFE)                return fBCxxWrite(a, v);                        // BFFE
    if (a >= 0xBFFF)                return fBCxxWrite(a, v);                        // BFFF
}

function fSpeaker(bOn) { /* Sound not yet implemented */ }

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
;
;   Atom mode memory declaration
;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

function STBA(a, v)
{
    var A = a >> 12;
    if (A < 8)   return MEM [a] = v;                                            // 0x0000 - 0x7FFF
    switch (A) {
        case  8:
        case  9: return fP(a - HIMEM, MEM [a] = v);                             // 0x8xxx - 0x9FFF
        case 10: return aBFFE & 0x01 ? MEM [a - 0x3000] = v : 0;                // 0xAxxx
        case 11: return fIOW(a, v & 0xFF);                                      // 0xBxxx
    }
}

function LDBA(a)
{
    var A = a >> 12;
    if (A < 10)  return MEM [a];                                                                                        // 0x0000 - 0x9FFF
    switch (A) {
        case 10: return aBFFE & 0x01 ? MEM [a - 0x3000] : aUtilRoms [aBFFF & 0x07].charCodeAt(a - 0xA000);              // 0xAxxx
        case 11: return fIOR(a) & 0xFF;                                                                                 // 0xBxxx
        case 12: return bAtoMMC_enable ? sFxxxPatch_ROM.charCodeAt(a - 0xC000) : sABASIC_IC20.charCodeAt(a - 0xC000);   // 0xCxxx
        case 13: return bAtoMMC_enable ? sDxxxPatch_ROM.charCodeAt(a - 0xD000) : sAFloat_IC21.charCodeAt(a - 0xD000);   // 0xDxxx
        case 14:
            if (bAtoMMC_enable)                                                                                         // 0xExxx
                switch (nFileSystem) {
                    case 0: return sDOSROM_U15.charCodeAt(a - 0xE000);
                    case 1: return sMMC297E_ROM.charCodeAt(a - 0xE000);
                    case 2: return sSDROMe_ROM.charCodeAt(a - 0xE000);
                }
            else
                return a >> 8;
        case 15: return bAtoMMC_enable ? sFxxxPatch_ROM.charCodeAt(a - 0xE000) : sABASIC_IC20.charCodeAt(a - 0xE000);   // 0xFxxx
    }
}

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
;
;   BBC mode memory declaration
;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

function STBB(a, v)
{
    var A = a >> 12;
    if (A < 6)   return MEM [a] = v;                                                    // 0x0000 - 0x5FFF
    switch (A) {
        case  6: return aBFFE & 0x01 ? MEM [a] = v : 0;                                 // 0x6xxx
        case  7: return aBFFE & 0x02 ? MEM [a] = v : 0;                                 // 0x7xxx
        case  8:
        case  9: return fP(a - 0x8000, MEM [a] = v);                                    // 0x8000 - 0x9FFF
        case 11: return fIOW(a, v & 0xFF)                                               // 0xBxxx
    }
}

function LDBB(a)
{
    var A = a >> 12;
    if (A < 6)   return MEM [a];                                                        // 0x0000 - 0x5FFF
    switch (A) {
        case  6: return aBFFE & 0x01 ? MEM [a] : sBBCEXT1_ROM.charCodeAt(a - 0x6000);   // 0x6xxx
        case  7: return aBFFE & 0x02 ? MEM [a] : sBBCEXT2_ROM.charCodeAt(a - 0x7000);   // 0x7xxx
        case  8:
        case  9: return MEM [a];                                                        // 0x8000 - 0x9FFF
        case 10: return sBASIC1_ROM.charCodeAt(a - 0xA000);                             // 0xAxxx
        case 11: return fIOR(a) & 0xFF;                                                 // 0xBxxx
        case 12: return sBASIC1_ROM.charCodeAt(a - 0xB000);                             // 0xCxxx
        case 13: return sBASIC1_ROM.charCodeAt(a - 0xB000);                             // 0xDxxx
        case 14: return sBASIC1_ROM.charCodeAt(a - 0xB000);                             // 0xExxx
        case 15: return sATOM_BBC_BASIC_OS_ROM.charCodeAt(a - 0xF000);                  // 0xFxxx
    }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function fClearMemory()
{
    MEM = cBuffer(0x10000);
    for (i = 0; i < 0xA000; MEM [i++] = 0);
    for (i = 8; i < 13; MEM [i++] = 256 * Math.random() | 0);
    for (i = 0x0100; i < 0x0200; MEM [i++] = 0);
}
