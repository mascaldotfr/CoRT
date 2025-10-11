FROM debian:trixie

RUN apt-get update && \
	    apt-get install -y --no-install-recommends \
	    ca-certificates \
	    caddy \
	    cron \
	    vim \
	    procps \
	    sudo \
	    git \
	    python3 \
	    python3-bs4 \
	    php-fpm \
	    php-cli \
	    php-sqlite3

# Create a dedicated user
RUN groupadd -r cort && \
    useradd -r -g cort -s /usr/sbin/nologin cort

# Copy caddy
COPY Caddyfile /etc/caddy/Caddyfile

# Configure caddy root
RUN mkdir -p /var/www/html/CoRT && \
	chown -R caddy:caddy /var/www && \
	chown cort:cort /var/www/html/CoRT

# git clone
# then change api url to your own installation
# and remove preload linking to the official API
RUN sudo -u cort git clone https://github.com/mascaldotfr/CoRT.git /var/www/html/CoRT && \
	sudo -u cort sed -i 's|https://cort\.thebus\.top/api|http://localhost:2810/CoRT/api|; s|https://mascaldotfr\.github\.io|http://localhost:2810|' /var/www/html/CoRT/js/api_url.js && \
	sudo -u cort sed -i '/<link rel="preload"/d' /var/www/html/CoRT/*.html
# XXX Note that you can't git pull or it will overwrite some or even all the
# above changes Best strategy is to keep the branch "main" for getting updates
# from github, and use a "local" branch for local changes with fine grained
# merge policy that you put as the main branch

# Configure the trainer saved setup db (must be writeable by php running as
# www-data) and stats.
RUN touch -d "1 week ago" /var/www/html/CoRT/api/var/trainer_saved_setups.txt
RUN touch -d "1 week ago" /var/www/html/CoRT/api/var/trainer_saved_setups.txt.gz
RUN touch -d "1 week ago" /var/www/html/CoRT/api/var/trainerstats.json
RUN touch -d "1 week ago" /var/www/html/CoRT/api/var/trainerstats.json.gz
RUN chown www-data /var/www/html/CoRT/api/var/trainer_saved_setups.txt* /var/www/html/CoRT/api/var/trainerstats.json*

# Copy cron job script (will be run by cort user)
COPY cort-cron /etc/cron.d/cort-cron
RUN chmod 0644 /etc/cron.d/cort-cron

# Open port 80
EXPOSE 80

# Start cron, php-fpm and caddy
CMD ["sh", "-c", "service cron start; service php8.4-fpm start; exec sudo -u caddy caddy run --config /etc/caddy/Caddyfile"]
