/*
;==============================================================
; BCxx.js, IO addresses #BC00-#BFFF                     KC 2017
;--------------------------------------------------------------
;
; #BFFF, #Axxx switchbyte.
;        Select romnr #BFFF for #Axxx
;
;==============================================================
*/

var	ROMnr=0,
	aAxxxROM = [],
	aUtilRoms = [];
	aUtilRoms[0] = sAXR1_ROM;
	aUtilRoms[1] = sPCHARM_ROM;
	aUtilRoms[2] = sAWROM_ROM;
	aUtilRoms[3] = sGAGS_ROM;
	aUtilRoms[4] = sPP_TOOLKIT_ROM;
	aUtilRoms[5] = sWATFORD_ROM;
	aUtilRoms[6] = sFPGA_UTILS_ROM;
	aUtilRoms[7] = sSDROM_ROM;

function fBCxxRead(nAddr){
  switch (a = nAddr){
    case 0xbfff:
      return (ROMnr&7);
    default:
//     tMessage ("Read " + nAddr.toString(16) + " PC:" + PCR.toString(16));

  }
}

function fBCxxWrite(nAddr,nVal){
  switch (a = nAddr){
    case 0xbfff:
      ROMnr = nVal&7;
      return (ROMnr);
    default:
//      tMessage ("Write " + nAddr.toString(16) + "," + nVal+ " PC:" + PCR.toString(16));
  }
}
