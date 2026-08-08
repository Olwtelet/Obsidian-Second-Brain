Cheatsheet pessoal. Não é referência completa, é o que eu procuro no histórico toda semana.

### Docker

```bash
docker ps -a                          # inclusive parados
docker exec -it <id> sh               # entrar no container
docker logs -f --tail 100 <id>
docker inspect <id> | less
docker stats                          # cpu/memória em tempo real

docker compose up -d --build          # rebuildar antes de subir
docker compose down -v                # -v APAGA os volumes, cuidado
docker compose logs -f api

docker system df                      # o que está ocupando disco
docker system prune -a                # limpa imagem não usada também
```

### Git

```bash
git log --oneline --graph --all
git log -S "textoQueSumiu"            # em qual commit essa string entrou/saiu
git log -p -- caminho/arquivo.js      # histórico de UM arquivo
git blame -L 40,60 arquivo.js

git stash push -m "wip"
git stash list && git stash pop

git restore --staged arquivo          # tirar do staging
git restore arquivo                   # descartar mudança local

git reflog                            # salvou minha vida mais de uma vez
git reset --hard HEAD@{3}

git commit --fixup <hash>
git rebase -i --autosquash HEAD~5

git switch -c nova-branch
git branch -d antiga
git push origin --delete antiga
```

`git log -S` é o mais subestimado da lista.

### npm

```bash
npm ls <pacote>          # quem trouxe essa dependência
npm outdated
npm ci                   # no CI, sempre
npm pkg get scripts
```

### Rede

```bash
dig api.exemplo.com +short
curl -v https://api.exemplo.com/health
curl -w "\ntempo: %{time_total}s\n" -o /dev/null -s <url>
lsof -i :3000            # quem está usando a porta
```

Windows: `netstat -ano | findstr :3000` e depois `taskkill /PID <pid> /F`.
