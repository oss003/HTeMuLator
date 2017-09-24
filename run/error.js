
// Error definitions

var
	aErrors =
	[
		{ nCode:   2, sName: "Too many GOSUBs" },
		{ nCode:   6, sName: "SUM  Checksum error" },
		{ nCode:  18, sName: "Too many DO statements" },
		{ nCode:  29, sName: "Unknown or missing function" },
		{ nCode:  30, sName: "Array too large in DIM statement" },
		{ nCode:  31, sName: "RETURN without GOSUB" },
		{ nCode:  39, sName: "Attempt to use variable in LIST" },
		{ nCode:  48, sName: "COM? Command error" },
		{ nCode:  69, sName: "Illegal FDIM statement" },
		{ nCode:  76, sName: "Assembler label error" },
		{ nCode:  91, sName: "No hexadecimal number after '#'" },
		{ nCode:  94, sName: "Unknown command, invalid statement terminator; missing END" },
		{ nCode:  95, sName: "Floating-point item missing or malformed" },
		{ nCode: 109, sName: "Number too large" },
		{ nCode: 111, sName: "Missing variable in FOR; too many FOR statements" },
		{ nCode: 118, sName: "NAME Name error" },
		{ nCode: 123, sName: "Illegal argument to floating-point function" },
		{ nCode: 127, sName: "Line number not found in GOTO or GOSUB" },
		{ nCode: 128, sName: "Argument to SIN, COS or TAN too large" },
		{ nCode: 129, sName: "Division by zero, protected RAM in graphics mode" },
		{ nCode: 134, sName: "Array subscript out of range" },
		{ nCode: 135, sName: "SYN? Syntax error" },
		{ nCode: 149, sName: "Floating-point array subscript out of range" },
		{ nCode: 152, sName: "GOSUB without RETURN; FOR without NEXT" },
		{ nCode: 156, sName: "Assembler error: illegal type" },
		{ nCode: 157, sName: "Label not found" },
		{ nCode: 159, sName: "Unmatched quotes in PRINT or INPUT" },
		{ nCode: 165, sName: "Loading interrupted" },
		{ nCode: 169, sName: "Floating-point result too large" },
		{ nCode: 174, sName: "Significant item missing or malformed" },
		{ nCode: 191, sName: "LOG or power of zero or a negative number" },
		{ nCode: 198, sName: "UNTIL with no DO" },
		{ nCode: 200, sName: "Unmatched quotes in string" },
		{ nCode: 208, sName: "Unrecognised mnemonic in assembler" },
		{ nCode: 216, sName: "Illegal DIM statement" },
		{ nCode: 230, sName: "NEXT without matching FOR" },
		{ nCode: 238, sName: "Argument to EXP too large" },
		{ nCode: 248, sName: "Not enough room to insert line" }
	];

function fDebug(s)
{
	$("dManual").innerHTML=s;
}
