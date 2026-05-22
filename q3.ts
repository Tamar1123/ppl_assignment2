import { map, join, reduce, T } from "ramda";
import {makeBinding, AtomicExp, isNumExp, isBoolExp, PrimOp, AppExp, isStrExp,isPrimOp, VarDecl, makeClassExp, Binding, CExp, ClassExp, Exp, ProcExp, Program, isAppExp, isAtomicExp, isClassExp, isDefineExp, isIfExp,
	isLetExp, isProcExp, isProgram, makeAppExp, makeDefineExp, makeIfExp, makeLetExp, makeLitExp, makePrimOp, makeProcExp,
	makeProgram, makeVarDecl, makeVarRef, 
	isVarRef} from "./L3/L3-ast";
import { makeOk, Result } from "./shared/result";

/*
Purpose: Transform L2 AST to Python program string
Signature: l2ToPython(l2AST)
Type: [Parsed | Error] => Result<string>
*/
export const l2ToPython = (exp: Exp | Program): Result<string>  => 
	isProgram(exp) ? makeOk(exp.exps.map((exp:Exp) => exp2py(exp)).join("\n")) :
					 makeOk(exp2py(exp));

const exp2py = (exp: Exp): string =>
	isDefineExp(exp) ?
		exp.var.var + " = " +  CExp2py(exp.val):
		CExp2py(exp);


const CExp2py = (exp: CExp): string =>
	isAtomicExp(exp) ? atomic2py(exp) :
	isIfExp(exp) ? "(" + CExp2py(exp.then) + " if (" + ifTest2py(exp.test) + ") else "  + CExp2py(exp.alt) + ")" :
	isProcExp(exp) ? "(lambda " + exp.args.map((arg : VarDecl) => arg.var).join(",") + " : "  + CExp2py(exp.body[0]) + ")":
	isAppExp(exp) ? app2py(exp) :
	"";

const ifTest2py = (test: CExp): string => {
	const t = CExp2py(test);
	return t.startsWith("(") && t.endsWith(")")
		? t.slice(1, -1)
		: t;
};

const atomic2py = (exp: AtomicExp) : string =>
	isNumExp(exp) ? String(exp.val) :
	isStrExp(exp) ? exp.val :
	isPrimOp(exp) ? prim2py(exp) :
	isVarRef(exp) ? exp.var :
    isBoolExp(exp) ? exp.val ? "True" : "False":
    "";

const prim2py = (exp : PrimOp) : string =>
	(exp.op === "boolean?") ? "(lambda x : (type(x) == bool))":
	(exp.op === "number?") ? "(lambda x : (type(x) == int) or (type(x) == float))" :
	(exp.op === "=") ? " == " :
	" " + exp.op + " ";

const app2py = (exp : AppExp) : string => 
	isPrimOp(exp.rator) ? (exp.rator.op === "boolean?") || (exp.rator.op === "number?") ? prim2py(exp.rator) + "(" + exp.rands.map((rand : CExp) => CExp2py(rand)).join(", ") + ")" :
	exp.rator.op === "not" ? "not " + CExp2py(exp.rands[0]) :
	"(" + exp.rands.map((rand : CExp) => CExp2py(rand)).join(prim2py(exp.rator)) + ")" :
	CExp2py(exp.rator) + "(" + exp.rands.map((rand : CExp) => CExp2py(rand)).join(",") + ")";
