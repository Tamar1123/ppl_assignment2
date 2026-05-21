import { map } from "ramda";
import { Binding, CExp, ClassExp, Exp, ProcExp, Program, isAppExp, isAtomicExp, isClassExp, isDefineExp, isIfExp,
    isLetExp, isProcExp, isProgram, makeAppExp, makeDefineExp, makeIfExp, makeLetExp, makeLitExp, makePrimOp, makeProcExp,
    makeProgram, makeVarDecl, makeVarRef } from "./L3-ast";
import { makeSymbolSExp } from "./L3-value";
import { makeOk, Result } from "../shared/result";

const methodNameTest = (method: Binding, msgVar: string): CExp =>
    makeAppExp(makePrimOp("eq?"), [makeVarRef(msgVar), makeLitExp(makeSymbolSExp(method.var.var))]);

const methodResultExp = (method: Binding): CExp =>
    isProcExp(method.val) && method.val.args.length === 0 && method.val.body.length === 1 ?
        method.val.body[0] :
        method.val;

const makeFuncBody = (methods: Binding[], msgVar: string): CExp =>
    methods.length === 0 ?
        makeLitExp(makeSymbolSExp("error")) :
        makeIfExp(methodNameTest(methods[0], msgVar),
                  methodResultExp(methods[0]),
                  makeFuncBody(methods.slice(1), msgVar));


/*
Purpose: Transform ClassExp to ProcExp
Signature: class2proc(classExp)
Type: ClassExp => ProcExp
*/
export const class2proc = (exp: ClassExp): ProcExp => 
    makeProcExp(exp.fields, [makeProcExp([makeVarDecl("msg")], [makeFuncBody(exp.methods, "msg")])]);


/*
Purpose: Transform all class forms in the given AST to procs
Signature: transform(AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const transform = (exp: Exp | Program): Result<Exp | Program> =>
    makeOk(isProgram(exp) ?
        makeProgram(map(transformExp, exp.exps)) :
        transformExp(exp));

const transformExp = (exp: Exp): Exp =>
    isDefineExp(exp) ?
        makeDefineExp(exp.var, transformCExp(exp.val)) :
        transformCExp(exp);

const transformCExp = (exp: CExp): CExp =>
    isAtomicExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(transformCExp(exp.test), transformCExp(exp.then), transformCExp(exp.alt)) :
    isProcExp(exp) ? makeProcExp(exp.args, map(transformCExp, exp.body)) :
    isAppExp(exp) ? makeAppExp(transformCExp(exp.rator), map(transformCExp, exp.rands)) :
    isLetExp(exp) ? makeLetExp(map(transformBinding, exp.bindings), map(transformCExp, exp.body)) :
    isClassExp(exp) ? class2proc(makeClassWithTransformedMethods(exp)) :
    exp;

const transformBinding = (binding: Binding): Binding => ({
    tag: "Binding",
    var: binding.var,
    val: transformCExp(binding.val)
});

const makeClassWithTransformedMethods = (exp: ClassExp): ClassExp => ({
    tag: "ClassExp",
    fields: exp.fields,
    methods: map(transformBinding, exp.methods)
});
