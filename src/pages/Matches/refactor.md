# Refactor  matches

matches siden skal kun vise en liste over kundeforspørsler og hvilke to 5 konsulenter som passer best
til oppdraget.

## Oppgave

- Det skal vises prosjektforespørser i en synkende liste etter dato
- det skal være mulig å klikke på en forspørsel, og da skal den utvides til å vise de
  konsulentene som passer best til oppdraget
- det skal vises metadata når linjen med forespørsel ikke er kolapset: at vi som firma har god dekning
  for oppdraget (dvs mange konsulenter som passer) - da skal den ha en grønn bakgrunnsfarge
- dersom vi har få (under 6) konsulenter som passer for oppdraget skal det vises en gul bakgrunnsfarge
- dersom vi har under 2 konsulenter skal det vises rød bakgrunnsfarge
- hver linje skal vise et antall konsulenter >= 10 (grønn), >= 5 (gul), <= 2(rød)


