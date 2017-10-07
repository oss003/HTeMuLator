/*
;==============================================================
; BCxx.js, IO addresses #BC00-#BFFF                     KC 2017
;--------------------------------------------------------------
;
; Mouse emulation:
;    #BDE8 - X-pos mouse pointer (0-255)
;    #BDE9 - Y-pos mouse (64-255, 255 = top)
;    #BDEA -  mouse control
;
; RAMROM emulation:
;    #BFFE - Status register RAMROM board
;    #BFFF - Switch byte util roms at #Axxx
;
;==============================================================
*/

/*
;==============================================================
; DEFINITION OF VARIABLES
;==============================================================
;
*/

// RAMROM variables

var     bRAMROM_enable = true,

        aBFFE= bBBC ? 3 : 0,
        aBFFF=0,

        aAxxxROM = [],
        aUtilRoms = [];

        aUtilRoms[0] = sWATFORD_ROM;
        aUtilRoms[1] = sPCHARM_ROM;
        aUtilRoms[2] = sAWROM_ROM;
        aUtilRoms[3] = sGAGS_ROM;
        aUtilRoms[4] = sPP_TOOLKIT_ROM;
        aUtilRoms[5] = sAXR1_ROM;
        aUtilRoms[6] = sFPGA_UTILS_ROM;
        aUtilRoms[7] = sSDROM_ROM;

// Mouse variables

var	nBDE8 = 128,	// X-pos mouse
	nBDE9 = 160,	// Y-pos mouse
	nBDEA = 0x07;	// Mouse control
	nBDEAw = 0x80;	// Mouse pointer

/*
;--------------------------------------------------------------
;
; fBCxxRead(nAddr)
;
; Read address nAddr in range #BC00-#BFFF
;
;--------------------------------------------------------------
*/

function fBCxxRead(nAddr){
  switch (a = nAddr){

    case 0xbde8:
      return nBDE8;

    case 0xbde9:
      return nBDE9;

    case 0xbdea:
      return nBDEA;

    case 0xbffe:
      return bRAMROM_enable ? aBFFE : a>>8;

    case 0xbfff:
      return bRAMROM_enable ? aBFFF : a>>8;

  }
}

/*
;--------------------------------------------------------------
;
; fBCxxWrite(nAddr,nVal)
;
; Write value nVal at address nAddr in range #BC00-#BFFF
;
;--------------------------------------------------------------
*/

function fBCxxWrite(nAddr,nVal)
{
	switch (a = nAddr){
		case 0xBDE8: return; // nBDE8 = nVal; // Eventually
		case 0xBDE9: return; // nBDE9 = nVal;
		case 0xBDEA: return fMouseCtrl(nVal);
		case 0xBFFE:
      if (bRAMROM_enable){
        aBFFE=nVal;
        if (nVal & 8){
          bBBC = true;
          fInitAddr();
          fClearMemory();
          break;
        } else if (bBBC == true){
          bBBC = false;
          fInitAddr();
          fClearMemory();
          break;
        }
        return aBFFE;
      } else {
        aBFFE=0;
        return;
      }

    case 0xbfff:
      if (bRAMROM_enable){
        aBFFF = nVal&7;
        return (aBFFF);
      } else {
        aBFFF = 0;
        return;
      }

    default:
//      tMessage ("Write " + nAddr.toString(16) + "," + nVal+ " PC:" + PCR.toString(16));

  }
}
