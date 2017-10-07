
var
	nTimerOut	= 1,
	nLines,
	sPrBuf		= "",
	nPortAInt	= 0x03,
	nPortBInt	= 0x18,

	nTimer1Int	= 0x40,
	nTimer2Int	= 0x20,
/*
	Alt. names (as per Atomic Theory And Practice)

	Data Register B					#B800	DB
	Data Register A					#B801	DA
	Data Register A					#B80F	DA

	On BREAK all registers of the VIA are reset to 0 (except Tl, T2 and SR).
	This places all peripheral lines in the input state, disables the timers,
	shift register, etc. and disables interrupts

	VIA			= 0xb800,		// VIA Data
	_ORB		= VIA,			// Data Register B				#B800	DRB
	_ORA		= VIA + 0x01,	// Data Register A				#B801	DRA
	_DDRB		= VIA + 0x02,	// Data Direction Register B	#B802	DDRB
	_DDRA		= VIA + 0x03,	// Data Direction Register A	#B803	DDRA
	_T1CL		= VIA + 0x04,	// Timer 1 Counter Low, Latch	#B804	T1CL
	_T1CH		= VIA + 0x05,	// Timer 1 Counter High			#B805	T1CH
	_T1LL		= VIA + 0x06,	// Timer 1 Latch Low			#B806	T1LL
	_T1LH		= VIA + 0x07,	// Timer 1 Latch High			#B807	TlLH
	_T2CL		= VIA + 0x08,	// Timer 2 Counter Low, Latch	#B808	T2CL
	_T2CH		= VIA + 0x09,	// Timer 2 Counter High			#B809	T2CH
	_SR			= VIA + 0x0a,	// Shift Register				#B80A	SR
	_ACR		= VIA + 0x0b,	// Auxiliary Control Register	#B80B	ACR
	_PCR		= VIA + 0x0c,	// Peripheral Control Register	#B80C	PCR
	_IFR		= VIA + 0x0d,	// Interrupt Flag Register		#B80D	IFR
	_IER		= VIA + 0x0e,	// Interrupt Enable Register	#B80E	IER
	_ORAnh		= VIA + 0x0f,	// Output Register A			#B80F	ORA
*/
	_ORB		= 0x00,	// Data Register B				#B800	DRB
	_ORA		= 0x01,	// Data Register A				#B801	DRA
	_DDRB		= 0x02,	// Data Direction Register B	#B802	DDRB
	_DDRA		= 0x03,	// Data Direction Register A	#B803	DDRA
	_T1CL		= 0x04,	// Timer 1 Counter Low, Latch	#B804	T1CL
	_T1CH		= 0x05,	// Timer 1 Counter High			#B805	T1CH
	_T1LL		= 0x06,	// Timer 1 Latch Low			#B806	T1LL
	_T1LH		= 0x07,	// Timer 1 Latch High			#B807	TlLH
	_T2CL		= 0x08,	// Timer 2 Counter Low, Latch	#B808	T2CL
	_T2CH		= 0x09,	// Timer 2 Counter High			#B809	T2CH
	_SR			= 0x0a,	// Shift Register				#B80A	SR
	_ACR		= 0x0b,	// Auxiliary Control Register	#B80B	ACR
	_PCR		= 0x0c,	// Peripheral Control Register	#B80C	PCR
	_IFR		= 0x0d,	// Interrupt Flag Register		#B80D	IFR
	_IER		= 0x0e,	// Interrupt Enable Register	#B80E	IER
	_ORAnh		= 0x0f,	// Output Register A			#B80F	ORA

oVia =
{
		nDRAI:	0,		// Data Register A Input		#B801			DRA				uint8_t
//		nORA:	0,		// Data Register A Output		#B801			DRA				uint8_t
		nORA:	0x80,	// 0 ???														uint8_t

		nDRBI:	0,		// Data Register B Input		#B800			DRB				uint8_t
		nORB:	0,		// Data Register B Output		#B800			DRB				uint8_t

        nDDRA:	0,		// Data Direction Register A	#B803			DDRA			uint8_t
		nDDRB:	0,		// Data Direction Register B	#B802			DDRB			uint8_t

        nACR:	0,		// Auxiliary Control Register	#B80B			ACR				uint8_t
		nPCR:	0,		// Peripheral Control Register	#B80C			PCR				uint8_t
		nIFR:	0,		// Interrupt Flag Register		#B80D			IFR				uint8_t
		nIER:	0,		// Interrupt Enable Register	#B80E			IER				uint8_t

		nPortA:	0,		// digital representation of Port A pins						uint8_t
		nPortB:	0,		// digital representation of Port B pins						uint8_t

		nT1C:	0x1fffe,// Timer 1 Counter Low & High	#B804	#B804	T1CL	T1CH	int ???		 uint32_t
		nT2C:	0x1fffe,// Timer 2 Counter Low & High	#B808	#B809	T2CL	T2CH	int ???		 uint32_t

		nT1L:	0x1fffe,// Timer 1 Latch Low  ???		#B806			T1LL			uint32_t
		nT2L:	0x1fffe,// Timer 1 Latch High ???		#B807			TlLH			uint32_t

		nT1Hit:	1,		// ???															int
		nT2Hit:	1		// ???															int

//		nSR:	0,		// Shift Register				#B80A			SR				uint8_t
//		nORA:	0		// Output Register A			#B80F			ORA				uint8_t
};

function fVIAIFRUpdate()
{
	if ((oVia.nIFR & 0x7f) & (oVia.nIER & 0x7f)) {
		oVia.nIFR  |= 0x80;
		nInterrupt |= 2; }
	else {
		oVia.nIFR  &= ~0x80;
		nInterrupt &= ~2; }
}

function fVIATimers()
{
	if (oVia.nT1C < -3) {
		while (oVia.nT1C < -3) oVia.nT1C += oVia.nT1L + 4;
		if (!oVia.nT1Hit) {
			oVia.nIFR |= nTimer1Int;
			fVIAIFRUpdate(); }
		if ((oVia.nACR & 0x80) && !oVia.nT1Hit) {
			oVia.nORB  ^= 0x80;
			oVia.nIRB  ^= 0x80;
			oVia.nPortB ^= 0x80;
			nTimerOut ^= 1; }
		if (!(oVia.nACR & 0x40)) oVia.nT1Hit = 1; }
	if (!(oVia.nACR & 0x20))
		if (oVia.nT2C < -3 && !oVia.nT2Hit) {
			if (!oVia.nT2Hit) {
				oVia.nIFR |= nTimer2Int;
				fVIAIFRUpdate(); }
			oVia.nT2Hit = 1; }
}

function fVIAWrite(nAddr, nVal)
{//fDebug("VIAW: "+fHexWord(nAddr)+' '+nVal)
	switch (nAddr & 0x0f) {
		case _ORA:	oVia.nIFR &= 0xfc; fVIAIFRUpdate();
				switch (nVal)
				{
				case 13:
					sPrBuf=sPrBuf + "\n";
					break;
				default:
					sPrBuf=sPrBuf + String.fromCharCode(nVal);
				}
		case _ORAnh:oVia.nORA = nVal; return oVia.nPortA = (oVia.nPortA & ~oVia.nDDRA) | (oVia.nORA & oVia.nDDRA);
		case _ORB:	oVia.nORB = nVal; oVia.nPortB = (oVia.nPortB & ~oVia.nDDRB) | (oVia.nORB & oVia.nDDRB);
					oVia.nIFR &= 0xfe; return fVIAIFRUpdate();
		case _DDRA:	return oVia.nDDRA = nVal;
		case _DDRB:	return oVia.nDDRB = nVal;
		case _ACR:	return oVia.nACR  = nVal;
		case _PCR:	return oVia.nPCR  = nVal;
		case _T1LL:
		case _T1CL:	return oVia.nT1L = (oVia.nT1L & 0xff00) | nVal;
		case _T1LH:	oVia.nT1L = (oVia.nT1L & 0xff) | nVal << 8; if (oVia.nACR & 0x40) { oVia.nIFR &= ~nTimer1Int; fVIAIFRUpdate(); } return;
		case _T1CH:	if ((oVia.nACR & 0xc0) == 0x80) nTimerOut = 0;
					oVia.nT1L = (oVia.nT1L & 0xff) | nVal << 8; oVia.nT1C = oVia.nT1L + 1;
					oVia.nIFR &= ~nTimer1Int; fVIAIFRUpdate(); return oVia.nT1Hit = 0;
		case _T2CL:	return oVia.nT2L = (oVia.nT2L & 0xff00) | nVal;
		case _T2CH:	if ((oVia.nT2C == -3 && (oVia.nIER & nTimer2Int)) || (oVia.nIFR & oVia.nIER & nTimer2Int)) nInterrupt |= 128;
					oVia.nT2L = (oVia.nT2L & 0xff) | nVal << 8; oVia.nT2C = oVia.nT2L + 1;
					oVia.nIFR &= ~nTimer2Int; fVIAIFRUpdate(); return oVia.nT2Hit = 0;
		case _IER:	if (nVal & 0x80)
					 oVia.nIER |= nVal & 0x7f; 
				else oVia.nIER &= ~(nVal & 0x7f); return fVIAIFRUpdate();
		case _IFR:	oVia.nIFR &= ~(nVal & 0x7f); fVIAIFRUpdate(); }
}

function fVIARead(nAddr)
{//fDebug("VIAR: "+fHexWord(nAddr))
	var nTemp;
	switch (nAddr & 0x0f) {
		case _ORA:	oVia.nIFR &= ~nPortAInt; fVIAIFRUpdate();
		case _ORAnh:nTemp = oVia.nORA & oVia.nDDRA; nTemp |= oVia.nPortA & ~oVia.nDDRA; return nTemp & 0x7f;
		case _ORB:	fVIAIFRUpdate(); nTemp = oVia.nORB & oVia.nDDRB;
					nTemp |= ((oVia.nACR & 0x02 ? oVia.nIRB : oVia.nPortB) & ~oVia.nDDRB) | 0xff;
					return nTimerOut ? nTemp | 0x80 : nTemp & ~0x80;
		case _DDRA:	return oVia.nDDRA;
		case _DDRB:	return oVia.nDDRB;
		case _T1LL:	return oVia.nT1L & 0xff;
		case _T1LH:	return oVia.nT1L >> 8;
		case _T1CL:	oVia.nIFR &= ~nTimer1Int; fVIAIFRUpdate(); return oVia.nT1C < -1 ? 0xff : oVia.nT1C & 0xff;
		case _T1CH:	return oVia.nT1C < -1 ? 0xff : oVia.nT1C >> 8;
		case _T2CL:	oVia.nIFR &= ~nTimer2Int; fVIAIFRUpdate(); return oVia.nT2C & 0xff;
		case _T2CH:	return oVia.nT2C >> 8;
		case _ACR:	return oVia.nACR;
		case _PCR:	return oVia.nPCR;
		case _IER:	return oVia.nIER | 0x80;
		case _IFR:	return oVia.nIFR; }
	return 0xff;
}

function fVIAReset()
{
	oVia.nORA = 0x80;
	oVia.nIFR = oVia.nIER = oVia.nACR = 0;
	oVia.nT1C = oVia.nT1L = oVia.nT2C = oVia.nT2L = 0x1fffe;
	oVia.nT1Hit = oVia.nT2Hit = nTimerOut = 1;
}

function fVIAPoll(nCycles)
{
	oVia.nT1C -= nCycles;
	if (!(oVia.nACR & 0x20)) oVia.nT2C -= nCycles;
	if (oVia.nT1C < -1 || oVia.nT2C < -1) fVIATimers();
}

function fVIADump()
{
	fLog("T1 = %04X %04X T2 = %04X %04X\n", oVia.nT1C, oVia.nT1L, oVia.nT2C, oVia.nT2L);
	fLog("%02X %02X %02X %02X\n", oVia.nIFR, oVia.nIER, oVia.nPCR, oVia.nACR);
}
