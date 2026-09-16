# Chat de espera — Diego Artow

Overlay transparente para usar como **Fonte de navegador** no OBS. Ele é separado do chat compacto e foi feito somente para a cena em que a webcam ocupa a tela.

## Teste visual

Abra `docs/index.html?demo=1` no navegador. Isso mostra mensagens de demonstração sem conectar à Twitch.

## Conexão da Twitch

Use uma conta/bot exclusiva, com permissão de leitura de chat, e crie a Fonte de navegador com uma URL neste formato:

```
https://SEU-ENDERECO/index.html?channel=diegoartow&nick=NOME_DO_BOT&token=oauth:SEU_TOKEN
```

O token não deve ser salvo no repositório nem compartilhado. Ele fica apenas na configuração local da Fonte de navegador do OBS.

### Parâmetros opcionais

- `max=4`: quantidade máxima de cartões simultâneos.
- `duration=13000`: tempo, em milissegundos, até a mensagem desaparecer.
- `demo=1`: usa mensagens de teste e não abre conexão com a Twitch.

## Ajuste no OBS

- Resolução da fonte: `1920 × 1080`.
- Fundo transparente.
- Posicione a fonte em tela cheia sobre a cena de espera; as mensagens já nascem no canto inferior esquerdo.
- Não use este overlay na cena de gameplay, pois o chat compacto atual continua independente.
