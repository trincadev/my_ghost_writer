FROM registry.gitlab.com/aletrn/my_ghost_writer_base:0.6.2

LABEL authors="trincadev"

# Include global arg in this stage of the build
ARG HOME="/home/python"
ENV VIRTUAL_ENV=${HOME}/.venv PATH="${HOME}/.venv/bin:$PATH"
ENV WRITE_TMP_ON_DISK=""
ENV MOUNT_GRADIO_APP=""
ENV SPACY_MODEL="en_core_web_sm"
ARG BASEURLCOMMITS1=https://api.github.com/repos/trincadev/lite.koboldai.net/commits?per_page=1
ARG BASEURLCOMMITS2=https://api.github.com/repos/trincadev/my_ghost_writer/commits?per_page=1
ENV BASEURL1=https://raw.githubusercontent.com/trincadev/lite.koboldai.net/refs/heads/mgw_smart_thesaurus
ENV BASEURL2=https://raw.githubusercontent.com/trincadev/my_ghost_writer/refs/heads/main
ENV NLTK_DATA=${HOME}/nltk_data

# Set working directory to function root directory
WORKDIR ${HOME}

RUN mkdir ${HOME}/lite.koboldai.net && chown python:python ${HOME}/lite.koboldai.net
RUN mkdir ${HOME}/my_ghost_writer && chown python:python -R ${HOME}/my_ghost_writer
RUN echo "NLTK_DATA: '${NLTK_DATA}'"
RUN mkdir -p ${NLTK_DATA} && chown python:python -R ${NLTK_DATA}
RUN ls -lAd ${NLTK_DATA} ${NLTK_DATA}/*
RUN ls -lA ${HOME}/
RUN ls -lA ${HOME}/.cache ${HOME}/.cache/pip
RUN ls -lAd ${HOME}/.cache ${HOME}/.cache/pip
COPY --chown=python:python ./lite.koboldai.net* ${HOME}/lite.koboldai.net
COPY --chown=python:python ./my_ghost_writer* ${HOME}/my_ghost_writer

# for lite.koboldai.net.txt we don't need the folder name: we are splitting the paths to keep only the filenames
# ${x##*/} will keep only the filename, in case of lite.koboldai.net
ADD ${BASEURLCOMMITS1} latest_commit
RUN ls -l ${HOME}/lite.koboldai.net/index.html || for x in $(cat ${HOME}/lite.koboldai.net.txt); do ${HOME}/download.sh "${BASEURL1}/${x##*/}" ${HOME}/lite.koboldai.net/; done
RUN ls -l ${HOME}/lite.koboldai.net/index.html || echo "did you checked if the files list from lite.koboldai.net.txt is ok? Maybe not keeping only the filenames?"
RUN ls -l ${HOME}/lite.koboldai.net/index.html

ADD ${BASEURLCOMMITS2} latest_commit
RUN ls -l ${HOME}/my_ghost_writer/app.py || for x in $(cat ${HOME}/my_ghost_writer.txt); do ${HOME}/download.sh "${BASEURL2}/$x" ${HOME}/my_ghost_writer/; done
RUN ls -l ${HOME}/my_ghost_writer/app.py
RUN ls -l ${HOME}/my_ghost_writer/custom_synonym_handler.py
RUN rm ./download.sh

# RUN . ${HOME}/.venv && which python && echo "# install samgis #" && pip install .
RUN if [ "${WRITE_TMP_ON_DISK}" != "" ]; then mkdir {WRITE_TMP_ON_DISK}; fi
RUN if [ "${WRITE_TMP_ON_DISK}" != "" ]; then ls -l {WRITE_TMP_ON_DISK}; fi

RUN ls -l /usr/bin/which
RUN /usr/bin/which python
RUN python --version
RUN pip list
RUN echo "PATH: ${PATH}."
RUN echo "HOME: ${HOME}."
RUN ls -l ${HOME}
RUN ls -ld ${HOME}
RUN ls -l ${HOME}/
RUN python -c "import sys; print(sys.path)"
RUN python -c "import nltk; nltk.download('punkt_tab', quiet=False)"
RUN python -c "import nltk; nltk.download('wordnet', quiet=False)"
RUN python -c "import nltk; nltk.download('wordnet31', quiet=False)"
RUN python -c "import spacy"
RUN echo "python -m spacy download \"${SPACY_MODEL}\""
RUN python -m spacy download "${SPACY_MODEL}"
RUN python -c "import fastapi"
RUN python -c "import uvicorn"
RUN python -c "import pymongo"
RUN python -c "import requests"
RUN df -h
RUN ls -l ${HOME}/my_ghost_writer/app.py
RUN ls -l ${HOME}/static/index.html
RUN ls -l ${HOME}/lite.koboldai.net/index.html
RUN chown python:python -R ${NLTK_DATA}
RUN ls -ld ${NLTK_DATA}
RUN find ${NLTK_DATA} -ls

USER 999
EXPOSE 7860

CMD ["uvicorn", "my_ghost_writer.app:app", "--host", "0.0.0.0", "--port", "7860"]
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD curl -f http://localhost:7860/health && curl -f http://localhost:7860/health-wordnet
