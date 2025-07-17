FROM registry.gitlab.com/aletrn/my_ghost_writer_base:0.5.3

LABEL authors="trincadev"

# Include global arg in this stage of the build
ARG HOME="/home/python"
ENV VIRTUAL_ENV=${HOME}/.venv PATH="${HOME}/.venv/bin:$PATH"
ENV WRITE_TMP_ON_DISK=""
ENV MOUNT_GRADIO_APP=""
ENV SPACY_MODEL="en_core_web_sm"

# Set working directory to function root directory
WORKDIR ${HOME}

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

USER 999
EXPOSE 7860

CMD ["uvicorn", "my_ghost_writer.app:app", "--host", "0.0.0.0", "--port", "7860"]
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD curl -f http://localhost:7860/health && curl -f http://localhost:7860/health-wordnet
