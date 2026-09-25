import sys
sys.path.insert(0, 'document-analysis-engine')
from app.services.extraction_service import extraction_service
from app.schemas.response import OCRResult, PageOCRResult
from app.schemas.request import DocumentMetadataInput

p1_text = """LAND RECORD REGISTER 7 
Village Landholding / Khata Details 
State I Province UTT A:R PR.AbE:SH Record Year ~o~Y 
District C,HA2.f~BA.D Tehsil LONI 
Villngc B A-m puR Patwar I Circle RemeuA c:1P-ctf:. 
Register / Khata No. 184 Page No. f1 
LANDHOLDER AND LAND PARCEL DETAILS 
Khata No. Khasra / Plot No. Landholder Name Father/ Spouse Name Area Unit Land Use 
184 11.1/.1. R<l-]e.k'h k'4mtJJ MAH ESH l<tJMh 0 • 94~0 1-fecfcA ~RICOLTlJ 
-RAL 
I & 4 I°< 8 / I RRIESH kOM~P. M4 HE SH l<cJMtP. 0•415'0 Hecfq-'I AB,RICOLTV 
R~L 
[84 13113 SUNITA .DE-\11 RffJf:~t1 l<t)Mflll 0·~160 Hecltu Re.1>iot ent,·-
aJ. 
IR4 lo~/\" RA J'~SH 1<umA-R HA f-f E..SH J<UMftR o · 1qoo H('cfw, f1 'iRl(ULTl)t. 
-AL 
184 13S-{I 
Additional Remarks 
Sc.J NI TA .D£\JI ~~JE5f-f l<UMA O • I~ 50 HfcfQJi /l-(,.q./(VL1U -AJ+l 
Date: f b ~ 0 & -,,? 04 4 Record Ofliecr: """

p2_text = """LAND RECORD REGISTER 
Cultivation/ Parcel Information 
Village 8A-m eue. District C.. tJ. 11 \"Z. l A 8 It-D --
Khata No. l 8~ Record Year ~o~ ~- ~5\" 
DET AlLS OF LAND PARCELS . . Khasra / Plot No. Area Unit Land Classification Irrigation Crop/ Use Remarks 
l~1 / ~ 0·84~0 H(cfqAe. ',Jn°cuRk~ Tu.be. we.d wh~a.t V eh l f' 'e.of 
. 
I ~8( I O·L.tl50 H~dMe Af' ,°clll. -k:. ~ Rcu~11/e.cal 11 u,JaJro( Vv,l-flecl ! 
I ~I/:) 0 ·~16o .Hfc~~ ~ e>,j de'1)f-t ai Nor R.. e.,-./detttl o.t R €coJl,de.ol A-~pi, ca I>&- u.M--
I 
t '3~ I~ o, J qqo H('~e. Af>,<'c~ Ttt.he wheat VtJ,ifle4 ' well -.,. 
' --
I 35{ I 0 '(~50 Hee~ 4t> ,~cJ2/wJ ~o.l-,.,J~ veer,~ Ve,, f U7 'eJ -:--;..~_ 
I 36/~ 0' OCf BD Hec~e ~FcctfU-wJ ~ tcu'.,.-J~ LJ~ Pe11ol tn3 ,; R. evi\"e.c.u ·. 
BOUNDARIES OF SELECTED PARCEL 
Khasra I Plot No. North South East West 
,~1/-l Vi.Ua._~ R~ l<ha.h..h.a.. C~ncJ.. Kh~Jia.. . ,~;/3 I~,/ 4 . """

p3_text = """LAND RECORD REGISTER 
Mutation /Transfer/ Record History 
Village g a M eug,, Khata No. l 89 
-, 
j 
District ~HB'2 IA- BMl Page No. 18 
-
MUTATION/ RECORD HISTORY 
Mutation No. Date K.hasra / Plot No. Nature of Entry From / Previous Hold flo I Present Holder Status 
'-14 I 8-06-a?°'-J I ~7/~ I-nh e>Jf.<1nce.. fvk.t~~ fZcd~ l+fifv,ov&:/ 
Kttww, ~t.fW\a..S? 
J..87 01-01-~o.1.J I J.8 / / ~m,\"1~ /'1(Ut)e~ P-..aje.f/4 !+p(>,ov&:A 
T>tq Kc.,maJr K 4 WLoh 
t> l'] ~,~03-~~, f :s, (:; scJL Ro..JUrl1 _g4nfkt A--fl>J,oV&:/ Cl 
J.(~~ J) e. \"' t 
fq m ,o }.~ Hcu,eyn ~'~ I 
:3~6 6S-04-4~1 f 3:)_/~ ~ovfri/ 
T,¼:f~fJ, I-< ti W\OJt /(.4~ 
33 I t t~o4-:?04~ I 3 5 / / C.o~J,ecn'fJr7 Roju-h ~~ Af>~ov&/ 
((4~ [~~ 
1. 
REGISTRATION/ DOCUMENT REFERENCE 
Reglstrlltion / Doc:ument No. & G:9 L .io~~ L 0 18. 7 I Date 1~ -03--<0~l( ' 
Office l ~ -03- ~o~ ~ Related Khasra l ~, L:J 
Nature of Document sa!h... J)f~ Present Holder SUNl7A .D~V I -"""

ocr = OCRResult(
    totalPages=3,
    fullText=p1_text + '\n' + p2_text + '\n' + p3_text,
    pages=[
        PageOCRResult(pageNumber=1, width=1000, height=1400, pageText=p1_text, tokens=[]),
        PageOCRResult(pageNumber=2, width=1000, height=1400, pageText=p2_text, tokens=[]),
        PageOCRResult(pageNumber=3, width=1000, height=1400, pageText=p3_text, tokens=[]),
    ]
)

meta = DocumentMetadataInput()
res = extraction_service.extract_fields(ocr, meta)
print('State:', res.state.value)
print('District:', res.district.value)
print('Tehsil:', res.tehsil.value)
print('Village:', res.village.value)
print('Khata:', res.khata_number.value)
print('Khasra:', res.khasra_number.value)
print('Owner:', res.owner_name.value)
print('Father:', res.father_guardian_name.value if res.father_guardian_name else None)
print('Landholders:', len(res.landholders), res.landholders)
print('LandParcels:', len(res.landParcels), res.landParcels)
print('Mutations:', len(res.mutations), res.mutations)
print('Registrations:', len(res.registrations), res.registrations)
