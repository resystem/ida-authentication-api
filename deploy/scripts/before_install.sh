
#!/bin/bash

#download node and npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 14

rm -rf /home/ubuntu/ida-authentication-api/dist/*
rm /etc/nginx/sites-enabled/default


rm -rf /lib/systemd/system/ida-authentication-api.service